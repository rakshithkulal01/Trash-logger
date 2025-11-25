import React, { useState, useEffect } from 'react';
import { TrashType } from '../types';
import { submitTrashEntry } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import LocationPicker from './LocationPicker';
import ProgressBar from './ProgressBar';
import ErrorMessage from './ErrorMessage';
import { getGPSErrorMessage, getPhotoErrorMessage, getFriendlyErrorMessage } from '../utils/errorMessages';
import { compressImage, needsCompression } from '../utils/imageCompression';
import './LogTrashForm.css';

interface FormData {
  trash_type: TrashType | '';
  latitude: number | '';
  longitude: number | '';
  photo: File | null;
  user_name: string;
}

const LogTrashForm: React.FC = () => {
  const { addEntry } = useAppContext();
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState<FormData>({
    trash_type: '',
    latitude: '',
    longitude: '',
    photo: null,
    user_name: '',
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Request GPS permission and get location on component mount
  useEffect(() => {
    requestGPSLocation();
  }, []);

  const requestGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setUseManualLocation(true);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Log GPS accuracy for debugging
        console.log('GPS Position:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        });

        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setGpsLoading(false);
        
        // Show accuracy info to user if available
        if (position.coords.accuracy > 100) {
          setGpsError(`Location found but accuracy is low (±${Math.round(position.coords.accuracy)}m). Consider using manual picker for better precision.`);
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        const errorMessage = getGPSErrorMessage(error);
        setGpsError(errorMessage);
        setGpsLoading(false);
        
        // Automatically show manual picker for permission denied
        if (error.code === error.PERMISSION_DENIED) {
          setUseManualLocation(true);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for better accuracy
        maximumAge: 30000, // Allow cached location up to 30 seconds old
      }
    );
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = getPhotoErrorMessage('Invalid file type');
      setValidationErrors(prev => ({
        ...prev,
        photo: errorMsg,
      }));
      showError(errorMsg);
      return;
    }

    // Validate file size (5MB max before compression)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      const errorMsg = getPhotoErrorMessage('File size too large');
      setValidationErrors(prev => ({
        ...prev,
        photo: errorMsg,
      }));
      showError(errorMsg);
      return;
    }

    // Clear photo validation error
    setValidationErrors(prev => {
      const { photo, ...rest } = prev;
      return rest;
    });

    try {
      // Compress image if needed (target: 1MB, max dimension: 1920px)
      let processedFile = file;
      const shouldCompress = await needsCompression(file, 1);
      
      if (shouldCompress) {
        processedFile = await compressImage(file, 1, 1920, 0.85);
        const compressionRatio = ((1 - processedFile.size / file.size) * 100).toFixed(0);
        console.log(`Image compressed by ${compressionRatio}%`);
      }

      setFormData(prev => ({ ...prev, photo: processedFile }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      const errorMsg = 'Failed to process image. Please try another photo.';
      setValidationErrors(prev => ({
        ...prev,
        photo: errorMsg,
      }));
      showError(errorMsg);
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    setValidationErrors(prev => {
      const { photo, ...rest } = prev;
      return rest;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.trash_type) {
      errors.trash_type = 'Please select a trash type';
    }

    if (formData.latitude === '' || formData.longitude === '') {
      errors.location = 'Location is required';
    } else {
      const lat = Number(formData.latitude);
      const lng = Number(formData.longitude);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.latitude = 'Latitude must be between -90 and 90';
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.longitude = 'Longitude must be between -180 and 180';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setUploadProgress(0);

    try {
      const entry = await submitTrashEntry(
        {
          trash_type: formData.trash_type as TrashType,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          photo: formData.photo || undefined,
          user_name: formData.user_name || undefined,
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      addEntry(entry);
      setSubmitSuccess(true);
      showSuccess('Trash entry logged successfully!');

      // Clear form after successful submission
      setFormData({
        trash_type: '',
        latitude: '',
        longitude: '',
        photo: null,
        user_name: '',
      });
      setPhotoPreview(null);
      setValidationErrors({});
      setUploadProgress(0);

      // Request GPS again for next entry
      setTimeout(() => {
        setSubmitSuccess(false);
        requestGPSLocation();
      }, 3000);

    } catch (error) {
      const friendlyError = getFriendlyErrorMessage(error instanceof Error ? error : 'Failed to submit trash entry');
      setSubmitError(friendlyError.message);
      showError(friendlyError.message);
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="log-trash-form">
      <form onSubmit={handleSubmit}>
        {/* GPS Status */}
        {gpsLoading && (
          <div className="gps-status loading" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true"></span>
            Getting your location...
          </div>
        )}

        {gpsError && (
          <ErrorMessage
            type="warning"
            message={gpsError}
            onRetry={!useManualLocation ? requestGPSLocation : undefined}
            retryLabel="Try Again"
          />
        )}

        {/* Trash Type */}
        <div className="form-group">
          <label htmlFor="trash_type">
            Trash Type <span className="required" aria-label="required">*</span>
          </label>
          <select
            id="trash_type"
            value={formData.trash_type}
            onChange={(e) => setFormData(prev => ({ ...prev, trash_type: e.target.value as TrashType }))}
            className={validationErrors.trash_type ? 'error' : ''}
            aria-required="true"
            aria-invalid={!!validationErrors.trash_type}
            aria-describedby={validationErrors.trash_type ? 'trash-type-error' : undefined}
          >
            <option value="">Select trash type</option>
            <option value="plastic">Plastic</option>
            <option value="glass">Glass</option>
            <option value="paper">Paper</option>
            <option value="bulky_item">Bulky Item</option>
            <option value="hazardous">Hazardous</option>
            <option value="other">Other</option>
          </select>
          {validationErrors.trash_type && (
            <span className="error-message" id="trash-type-error" role="alert">{validationErrors.trash_type}</span>
          )}
        </div>

        {/* Location */}
        <div className="form-group">
          <label id="location-label">
            Location <span className="required" aria-label="required">*</span>
          </label>
          
          {useManualLocation ? (
            <LocationPicker
              initialLocation={
                formData.latitude && formData.longitude
                  ? { lat: Number(formData.latitude), lng: Number(formData.longitude) }
                  : undefined
              }
              onLocationSelect={handleLocationSelect}
            />
          ) : (
            <div className="location-display">
              <div className="coordinate-row">
                <span className="coordinate-label">Latitude:</span>
                <span className="coordinate-value">
                  {formData.latitude !== '' ? Number(formData.latitude).toFixed(6) : '—'}
                </span>
              </div>
              <div className="coordinate-row">
                <span className="coordinate-label">Longitude:</span>
                <span className="coordinate-value">
                  {formData.longitude !== '' ? Number(formData.longitude).toFixed(6) : '—'}
                </span>
              </div>
              <div className="location-actions">
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  onClick={requestGPSLocation}
                  disabled={gpsLoading}
                  aria-label="Retry GPS location"
                >
                  🔄 Retry GPS
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  onClick={() => setUseManualLocation(true)}
                  aria-label="Switch to manual location picker"
                >
                  📍 Manual Picker
                </button>
              </div>
            </div>
          )}
          
          {validationErrors.location && (
            <span className="error-message">{validationErrors.location}</span>
          )}
          {validationErrors.latitude && (
            <span className="error-message">{validationErrors.latitude}</span>
          )}
          {validationErrors.longitude && (
            <span className="error-message">{validationErrors.longitude}</span>
          )}
        </div>

        {/* Photo Upload */}
        <div className="form-group">
          <label htmlFor="photo">Photo (Optional)</label>
          
          {!photoPreview ? (
            <div className="photo-upload">
              <input
                type="file"
                id="photo"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handlePhotoChange}
                className="file-input"
                aria-label="Upload photo of trash"
              />
              <label htmlFor="photo" className="file-label">
                <span className="file-icon" aria-hidden="true">📷</span>
                Choose Photo
              </label>
            </div>
          ) : (
            <div className="photo-preview">
              <img src={photoPreview} alt="Preview of uploaded trash photo" />
              <button
                type="button"
                className="btn-remove"
                onClick={removePhoto}
                aria-label="Remove uploaded photo"
              >
                <span aria-hidden="true">✕</span> Remove
              </button>
            </div>
          )}
          
          {validationErrors.photo && (
            <span className="error-message" role="alert">{validationErrors.photo}</span>
          )}
        </div>

        {/* User Name */}
        <div className="form-group">
          <label htmlFor="user_name">Your Name (Optional)</label>
          <input
            type="text"
            id="user_name"
            value={formData.user_name}
            onChange={(e) => setFormData(prev => ({ ...prev, user_name: e.target.value }))}
            placeholder="Leave blank to remain anonymous"
            aria-describedby="user-name-hint"
          />
          <span className="field-hint" id="user-name-hint">Your name will be displayed with this entry</span>
        </div>

        {/* Upload Progress */}
        {submitting && formData.photo && uploadProgress > 0 && (
          <ProgressBar 
            progress={uploadProgress} 
            message="Uploading photo..." 
            showPercentage={true}
          />
        )}

        {/* Submit Error */}
        {submitError && (
          <ErrorMessage
            type="error"
            message={submitError}
            onRetry={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            retryLabel="Retry Submission"
          />
        )}

        {/* Submit Success */}
        {submitSuccess && (
          <div className="submit-success" role="status" aria-live="polite">
            <span aria-hidden="true">✓</span> Trash entry logged successfully!
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary btn-large"
          disabled={submitting || gpsLoading}
          aria-label={submitting ? 'Submitting trash entry' : 'Submit trash entry'}
        >
          {submitting ? 'Submitting...' : 'Log Trash'}
        </button>
      </form>
    </div>
  );
};

export default LogTrashForm;
