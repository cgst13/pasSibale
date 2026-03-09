import { Capacitor } from '@capacitor/core';

export const isNative = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform(); // 'web', 'android', or 'ios'
};

export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

export const isWeb = () => {
  return Capacitor.getPlatform() === 'web';
};
