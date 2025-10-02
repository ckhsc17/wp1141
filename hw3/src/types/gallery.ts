export type ControlType = 'FirstPerson' | 'Orbit' | 'PointerLock';

export interface DisplayCasePosition {
  x: number;
  z: number;
}

export interface GalleryProps {
  isOpen: boolean;
  onClose: () => void;
}