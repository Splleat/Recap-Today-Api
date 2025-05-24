export class CreateScheduleDto {
    userId: string;
    text: string;
    subText?: string;
    dayOfWeek?: number;
    selectedDate?: string;
    isRoutine: boolean;
    startTime: string;
    endTime: string;
    color?: string;
    hasAlarm?: boolean;
    alarmOffset?: number;
}
