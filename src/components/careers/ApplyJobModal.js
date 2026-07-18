import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import careersApi, {
  isFieldVisible,
  validateFieldValue,
  validateResumeFile,
  RESUME_ACCEPT,
} from "../../services/careersApi";
import styles from "./ApplyJobModal.module.css";

// =============================================================================
// ApplyJobModal — the popup application flow.
//
// Renders the vacancy's admin-configured form (job.applicationForm.fields):
// standard + custom fields, conditional visibility, per-type validation, and a
// validated resume upload with real progress. While uploading or submitting
// the modal CANNOT be dismissed (backdrop, ✕ and Escape are all inert) so a
// slow connection never loses a half-sent application.
//
// onSuccess(application) fires after the application is persisted — the parent
// navigates to the Thank-You page.
// =============================================================================

const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ApplyJobModal = ({ open, job, departmentName, pageConfig, onClose, onSuccess }) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null); // null | 0–100
  const [phase, setPhase] = useState("form"); // form | uploading | saving
  const [submitError, setSubmitError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const panelRef = useRef(null);
  const fileInputRef = useRef(null);
  const busy = phase === "uploading" || phase === "saving";

  const fields = (job?.applicationForm?.fields || []).filter((f) => f.enabled !== false);
  const formFields = fields.filter((f) => f.type !== "file");
  const resumeField = fields.find((f) => f.type === "file");

  // Reset per open so a reopened modal never shows a stale draft of another job.
  useEffect(() => {
    if (open) {
      setValues({});
      setErrors({});
      setResumeFile(null);
      setResumeError(null);
      setUploadProgress(null);
      setPhase("form");
      setSubmitError(null);
    }
  }, [open, job?.id]);

  // Scroll lock + Escape (Escape is disabled while busy — see header comment).
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => panelRef.current?.querySelector("input, textarea, select")?.focus(), 120);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, busy, onClose]);

  const setValue = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: null } : prev));
    setSubmitError(null);
  }, []);

  const pickFile = (file) => {
    const problem = validateResumeFile(file);
    setResumeError(problem);
    setResumeFile(problem ? null : file);
    setUploadProgress(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    // Validate every visible field + the resume in one pass, then focus the
    // first problem so keyboard/screen-reader users land on it directly.
    const nextErrors = {};
    formFields.forEach((field) => {
      if (!isFieldVisible(field, values)) return;
      const problem = validateFieldValue(field, values[field.key]);
      if (problem) nextErrors[field.key] = problem;
    });
    const resumeProblem = resumeField?.required !== false ? validateResumeFile(resumeFile) : resumeFile ? validateResumeFile(resumeFile) : null;
    setErrors(nextErrors);
    setResumeError(resumeProblem);

    if (Object.keys(nextErrors).length > 0 || resumeProblem) {
      const firstKey = Object.keys(nextErrors)[0];
      const el = firstKey
        ? panelRef.current?.querySelector(`[data-field="${firstKey}"]`)
        : panelRef.current?.querySelector(`.${styles.dropzone}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      let resumeMeta = null;
      if (resumeFile) {
        setPhase("uploading");
        setUploadProgress(0);
        resumeMeta = await careersApi.uploadResume(resumeFile, setUploadProgress);
      }

      setPhase("saving");
      const application = await careersApi.submitApplication({
        job,
        values,
        resume: resumeMeta,
        pageConfig: { ...pageConfig, _departmentName: departmentName },
      });
      onSuccess(application);
    } catch (err) {
      setPhase("form");
      setUploadProgress(null);
      const message = careersApi.getErrorMessage(err);
      if (err.code === "DUPLICATE_APPLICATION" || err.code === "VACANCY_CLOSED") {
        setSubmitError(err.message);
      } else if (err.isValidation) {
        setResumeError(err.message);
      } else if (!navigator.onLine) {
        setSubmitError("You appear to be offline. Check your connection and try again — your answers are preserved.");
      } else {
        setSubmitError(message || "Something went wrong while submitting. Please try again.");
      }
    }
  };

  if (!open || !job) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="apply-backdrop"
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !busy && onClose()}
      >
        <motion.div
          key="apply-panel"
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-modal-title"
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.98 }}
          transition={{ type: "spring", damping: 28, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles.header}>
            <div>
              <p className={styles.headerEyebrow}>Apply for</p>
              <h2 id="apply-modal-title" className={styles.headerTitle}>{job.title}</h2>
              <p className={styles.headerMeta}>
                {[departmentName, job.location].filter(Boolean).join(" · ")}
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              disabled={busy}
              aria-label="Close application form"
              title={busy ? "Please wait for the submission to finish" : "Close"}
            >
              <Icon icon="mdi:close" />
            </button>
          </header>

          <form className={styles.body} onSubmit={handleSubmit} noValidate>
            {submitError && (
              <div className={styles.submitError} role="alert">
                <Icon icon="mdi:alert-circle-outline" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}

            <div className={styles.fieldGrid}>
              {formFields.map((field) =>
                isFieldVisible(field, values) ? (
                  <Field
                    key={field.id || field.key}
                    field={field}
                    value={values[field.key]}
                    error={errors[field.key]}
                    disabled={busy}
                    onChange={(v) => setValue(field.key, v)}
                  />
                ) : null
              )}
            </div>

            {/* ---- Resume upload ---- */}
            {resumeField && (
              <div className={styles.resumeBlock}>
                <span className={styles.fieldLabel}>
                  {resumeField.label}
                  {resumeField.required !== false && <em aria-hidden="true"> *</em>}
                </span>
                <div
                  className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ""} ${resumeError ? styles.dropzoneError : ""} ${resumeFile && !resumeError ? styles.dropzoneReady : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!busy) setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (!busy && e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={RESUME_ACCEPT}
                    className={styles.fileInput}
                    disabled={busy}
                    onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
                    aria-label={resumeField.label}
                  />
                  {!resumeFile ? (
                    <button
                      type="button"
                      className={styles.dropzoneInner}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy}
                    >
                      <Icon icon="mdi:cloud-upload-outline" className={styles.dropzoneIcon} aria-hidden="true" />
                      <span className={styles.dropzoneText}>
                        <strong>Click to upload</strong> or drag &amp; drop
                      </span>
                      <span className={styles.dropzoneHint}>
                        {resumeField.helpText || "PDF, DOC or DOCX — up to 10 MB"}
                      </span>
                    </button>
                  ) : (
                    <div className={styles.fileRow}>
                      <Icon
                        icon={uploadProgress === 100 ? "mdi:check-circle" : "mdi:file-document-outline"}
                        className={uploadProgress === 100 ? styles.fileIconDone : styles.fileIcon}
                        aria-hidden="true"
                      />
                      <div className={styles.fileInfo}>
                        <span className={styles.fileName}>{resumeFile.name}</span>
                        <span className={styles.fileSize}>
                          {formatBytes(resumeFile.size)}
                          {uploadProgress === 100 && " · Uploaded"}
                        </span>
                        {uploadProgress !== null && uploadProgress < 100 && (
                          <span
                            className={styles.progressTrack}
                            role="progressbar"
                            aria-valuenow={uploadProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Resume upload progress"
                          >
                            <span className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                          </span>
                        )}
                      </div>
                      {!busy && (
                        <button
                          type="button"
                          className={styles.fileRemove}
                          onClick={() => {
                            setResumeFile(null);
                            setUploadProgress(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          aria-label="Remove selected file"
                        >
                          <Icon icon="mdi:close" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {resumeError && (
                  <span className={styles.fieldError} role="alert">{resumeError}</span>
                )}
              </div>
            )}

            <footer className={styles.footer}>
              <p className={styles.privacyNote}>
                <Icon icon="mdi:shield-check-outline" aria-hidden="true" />
                Your details are used only for this hiring process.
              </p>
              <div className={styles.footerActions}>
                <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={busy}>
                  {phase === "uploading" && (
                    <>
                      <Icon icon="mdi:loading" className={styles.spin} aria-hidden="true" />
                      Uploading resume… {uploadProgress ?? 0}%
                    </>
                  )}
                  {phase === "saving" && (
                    <>
                      <Icon icon="mdi:loading" className={styles.spin} aria-hidden="true" />
                      Submitting…
                    </>
                  )}
                  {phase === "form" && (
                    <>
                      Submit Application
                      <Icon icon="mdi:send" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </footer>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// -----------------------------------------------------------------------------
// Field — renders one configured form field by type.
// -----------------------------------------------------------------------------
const Field = ({ field, value, error, disabled, onChange }) => {
  const id = `apply-${field.key}`;
  const errorId = error ? `${id}-error` : undefined;
  const helpId = field.helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;
  const wide = field.type === "textarea" || field.type === "multiselect" || field.type === "radio";

  const inputProps = {
    id,
    "data-field": field.key,
    disabled,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    "aria-required": field.required === true,
  };

  const control = (() => {
    switch (field.type) {
      case "textarea":
        return (
          <textarea
            {...inputProps}
            className={`${styles.input} ${styles.textarea} ${error ? styles.inputError : ""}`}
            value={value || ""}
            placeholder={field.placeholder}
            maxLength={field.maxLength || undefined}
            rows={4}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "select":
        return (
          <select
            {...inputProps}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select…</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case "multiselect": {
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className={styles.optionGroup} role="group" aria-labelledby={`${id}-label`} data-field={field.key}>
            {(field.options || []).map((opt) => {
              const checked = selected.includes(opt);
              return (
                <label key={opt} className={`${styles.optionChip} ${checked ? styles.optionChipOn : ""}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() =>
                      onChange(checked ? selected.filter((v) => v !== opt) : [...selected, opt])
                    }
                  />
                  {checked && <Icon icon="mdi:check" aria-hidden="true" />}
                  {opt}
                </label>
              );
            })}
          </div>
        );
      }
      case "radio":
        return (
          <div className={styles.optionGroup} role="radiogroup" aria-labelledby={`${id}-label`} data-field={field.key}>
            {(field.options || []).map((opt) => (
              <label key={opt} className={`${styles.optionChip} ${value === opt ? styles.optionChipOn : ""}`}>
                <input
                  type="radio"
                  name={id}
                  checked={value === opt}
                  disabled={disabled}
                  onChange={() => onChange(opt)}
                />
                {value === opt && <Icon icon="mdi:check" aria-hidden="true" />}
                {opt}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <label className={styles.checkboxRow} data-field={field.key}>
            <input
              type="checkbox"
              checked={value === true}
              disabled={disabled}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span>{field.placeholder || field.label}</span>
          </label>
        );
      case "date":
        return (
          <input
            {...inputProps}
            type="date"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "number":
        return (
          <input
            {...inputProps}
            type="number"
            inputMode="numeric"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      default:
        // text / email / phone / url share the plain input with tuned attrs.
        return (
          <input
            {...inputProps}
            type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "url" ? "url" : "text"}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={value || ""}
            placeholder={field.placeholder}
            maxLength={field.maxLength || undefined}
            autoComplete={
              { fullName: "name", email: "email", phone: "tel", city: "address-level2", state: "address-level1", country: "country-name" }[field.key]
            }
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  })();

  return (
    <div className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
      {field.type !== "checkbox" && (
        <label htmlFor={id} id={`${id}-label`} className={styles.fieldLabel}>
          {field.label}
          {field.required && <em aria-hidden="true"> *</em>}
        </label>
      )}
      {control}
      {field.helpText && field.type !== "file" && (
        <span id={helpId} className={styles.fieldHelp}>{field.helpText}</span>
      )}
      {error && (
        <span id={errorId} className={styles.fieldError} role="alert">{error}</span>
      )}
    </div>
  );
};

export default ApplyJobModal;
