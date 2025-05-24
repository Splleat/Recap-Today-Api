export class UpdateScheduleDto {
    text?: string;
    subText?: string;
    dayOfWeek?: number;
    selectedDate?: string;
    startTime?: string;
    endTime?: string;
    color?: string;
    hasAlarm?: boolean;
    alarmOffset?: number;
}