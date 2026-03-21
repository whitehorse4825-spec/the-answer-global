declare module "lunar-javascript" {
  export class Solar {
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getEightChar(): EightChar;
  }

  export type YunGender = 0 | 1;

  export interface DaYunRow {
    getGanZhi(): string;
    getStartAge(): number;
    getEndAge(): number;
  }

  export interface YunInstance {
    getDaYun(n?: number): DaYunRow[];
  }

  export interface EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getYearHideGan(): string;
    getMonthHideGan(): string;
    getDayHideGan(): string;
    getTimeHideGan(): string;
    getYun(gender: YunGender, sect?: number): YunInstance;
  }
}
