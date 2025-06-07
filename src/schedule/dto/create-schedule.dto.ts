export class CreateScheduleDto {
    userId: string;
    text: string;
    subText?: string;
    dayOfWeek?: number;
    selectedDate?: string;
    isRoutine: boolean;
    startTimeHour: number;
    startTimeMinute: number;
    endTimeHour: number;
    endTimeMinute: number;
    colorValue?: number;
    hasAlarm?: boolean;
    alarmOffset?: number;
}
