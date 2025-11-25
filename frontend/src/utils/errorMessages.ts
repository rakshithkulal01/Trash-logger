// User-friendly error messages for common scenarios

export interface FriendlyError {
  title: string;
  message: string;
  retryable: boolean;
}

export function getFriendlyErrorMessage(error: Error | string): FriendlyError {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerError = errorMessage.toLowerCase();

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      retryable: true,
    };
  }

  // Offline
  if (lowerError.includes('offline')) {
    return {
      title: 'You\'re Offline',
      message: 'It looks like you\'re not connected to the internet. Please check your connection and try again.',
      retryable: true,
    };
  }

  // GPS/Location errors
  if (lowerError.includes('permission denied') || lowerError.includes('geolocation')) {
    return {
      title: 'Location Access Needed',
      message: 'We need access to your location to log trash entries. Please enable location permissions in your browser settings, or use the manual location picker.',
      retryable: false,
    };
  }

  if (lowerError.includes('position unavailable')) {
    return {
      title: 'Location Unavailable',
      message: 'Your device couldn\'t determine your location. Please try again or use the manual location picker.',
      retryable: true,
    };
  }

  if (lowerError.includes('timeout')) {
    return {
      title: 'Location Timeout',
      message: 'Getting your location took too long. Please try again or use the manual location picker.',
      retryable: true,
    };
  }

  // Photo upload errors
  if (lowerError.includes('file') && lowerError.includes('size')) {
    return {
      title: 'Photo Too Large',
      message: 'The photo you selected is too large. Please choose a photo smaller than 5MB or compress it before uploading.',
      retryable: false,
    };
  }

  if (lowerError.includes('file') && lowerError.includes('type')) {
    return {
      title: 'Invalid Photo Format',
      message: 'Please select a JPEG or PNG image file.',
      retryable: false,
    };
  }

  if (lowerError.includes('upload')) {
    return {
      title: 'Upload Failed',
      message: 'We couldn\'t upload your photo. Please check your connection and try again.',
      retryable: true,
    };
  }

  // Validation errors
  if (lowerError.includes('validation') || lowerError.includes('invalid')) {
    return {
      title: 'Invalid Information',
      message: 'Please check that all required fields are filled out correctly.',
      retryable: false,
    };
  }

  // Server errors
  if (lowerError.includes('500') || lowerError.includes('server error')) {
    return {
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again in a few moments.',
      retryable: true,
    };
  }

  if (lowerError.includes('503') || lowerError.includes('unavailable')) {
    return {
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again in a few minutes.',
      retryable: true,
    };
  }

  // Rate limiting
  if (lowerError.includes('429') || lowerError.includes('too many')) {
    return {
      title: 'Too Many Requests',
      message: 'You\'re making requests too quickly. Please wait a moment and try again.',
      retryable: true,
    };
  }

  // Default error
  return {
    title: 'Something Went Wrong',
    message: errorMessage || 'An unexpected error occurred. Please try again.',
    retryable: true,
  };
}

// GPS-specific error messages
export function getGPSErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission denied. To log trash with your current location, please enable location access in your browser settings. You can also use the manual location picker below.';
    
    case error.POSITION_UNAVAILABLE:
      return 'Your location is currently unavailable. This might be due to poor GPS signal. Please try again or use the manual location picker.';
    
    case error.TIMEOUT:
      return 'Getting your location took too long. Please try again or use the manual location picker to set your location manually.';
    
    default:
      return 'Unable to get your location. Please use the manual location picker to set your location.';
  }
}

// Photo upload error messages
export function getPhotoErrorMessage(error: string): string {
  if (error.includes('size')) {
    return 'The photo is too large. Please select a photo smaller than 5MB. You can compress the image using your phone\'s photo editor or an online tool.';
  }
  
  if (error.includes('type') || error.includes('format')) {
    return 'This file format is not supported. Please select a JPEG or PNG image.';
  }
  
  if (error.includes('upload') || error.includes('network')) {
    return 'Failed to upload the photo. Please check your internet connection and try again. You can also submit without a photo.';
  }
  
  return 'There was a problem with the photo. Please try selecting a different image or submit without a photo.';
}

// Network error detection
export function isNetworkError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerError = errorMessage.toLowerCase();
  
  return (
    lowerError.includes('network') ||
    lowerError.includes('fetch') ||
    lowerError.includes('offline') ||
    lowerError.includes('connection')
  );
}
