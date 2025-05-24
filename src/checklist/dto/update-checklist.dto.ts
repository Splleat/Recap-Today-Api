export class UpdateChecklistDto {
    id: string;
    text?: string;
    subtext?: string;
    isChecked?: boolean;
    dueDate?: Date;
    completedDate?: Date;
}