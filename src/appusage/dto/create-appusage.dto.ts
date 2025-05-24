export class CreateAppUsageDto {
    userId: string;
    date: string;
    packageName: string;
    appName: string;
    usageTimeInMillis: number;
    appIconPath?: string;
}