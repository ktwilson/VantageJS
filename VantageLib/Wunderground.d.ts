import Database from './Database';
import WeatherAlert from './WeatherAlert';
import { VPCurrent } from './VPCurrent';
export default class Wunderground {
    config: any;
    database: Database;
    constructor();
    getAlerts(): Promise<WeatherAlert[]>;
    upload(current: VPCurrent): void;
    updateFromArchive(): Promise<{}>;
}
//# sourceMappingURL=Wunderground.d.ts.map