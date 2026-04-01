export interface WeekSchedule {
  days: number[];   // 0=Zo, 1=Ma, 2=Di, 3=Wo, 4=Do, 5=Vr, 6=Za
  startTime: string; // "08:00"
  durationHours: number;
  location: {
    lat: number;
    lon: number;
    label: string;
  };
  label: string;
}

export const DEFAULT_SCHEDULE: WeekSchedule = {
  days: [1, 2, 3, 4, 5], // ma t/m vr
  startTime: '08:00',
  durationHours: 1,
  location: { lat: 52.37, lon: 4.9, label: '' },
  label: 'Woon-werk',
};
