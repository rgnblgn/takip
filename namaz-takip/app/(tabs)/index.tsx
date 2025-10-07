import React from 'react';
import { Slot } from 'expo-router';

export default function TabsIndex() {
  // The Slot component renders the nested routes for the current tab.
  // This ensures tapping on the top tabs shows the corresponding screens
  // (takvim, gun-detay, profil).
  return <Slot />;
}
