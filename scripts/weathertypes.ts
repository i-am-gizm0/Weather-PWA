export type {
    WeatherData,
    DataBlock,
    DataPoint,
    CurrentData,
    HourData,
    DayData,
    Alert,
    UnixTimeStamp,
    URI,
    WeatherIcon,
    PrecipitationType,
    AlertSeverity
};

type WeatherData = {
    latitude: number,
    longitude: number,
    timezone: string,
    offset: number,
    currently?: CurrentData,
    minutely?: DataBlock<DataPoint>,
    hourly?: DataBlock<HourData>,
    daily?: DataBlock<DayData>,
    alerts?: Array<Alert>,
    flags?: {
        "darksky-unavailable"?: string,
        "nearest-station": number,
        sources: Array<string>,
        units: string
    },
}

interface DataBlock<Period> {
    summary: string,
    icon: WeatherIcon,
    data: Array<Period>
}

interface DataPoint {
    cloudCover?: number,
    dewPoint?: number,
    humidity?: number,
    icon?: WeatherIcon,
    ozone?: number,
    precipIntensity?: number,
    precipIntensityError?: number,
    precipProbability?: number,
    precipType?: PrecipitationType,
    pressure?: number,
    summary: string,
    time: UnixTimeStamp,
    uvIndex?: number,
    visibility?: number,
    windBearing?: number,
    windGust?: number,
    windSpeed?: number
}

interface CurrentData extends DataPoint, HourData {
    nearestStormBearing?: number,
    nearestStormDistance?: number
}

interface HourData extends DataPoint {
    apparentTemperature?: number,
    precipAccumulation?: number,
    temperature?: number,
}

interface DayData extends DataPoint {
    apparentHighTemperature?: number,
    apparentTemperatureHighTime?: UnixTimeStamp,
    apparentTemperatureLow?: number,
    apparentTemperatureLowTime?: UnixTimeStamp,
    apparentTemperatureMax?: number,
    apparentTemperatureMaxTime?: UnixTimeStamp,
    apparentTemperatureMin?: number,
    apparentTemperatureMinTime?: UnixTimeStamp,
    moonPhase?: number,
    precipAccumulation?: number,
    precipIntensityMax?: number,
    precipIntensityMaxTime?: UnixTimeStamp,
    sunriseTime?: UnixTimeStamp,
    sunsetTime?: UnixTimeStamp,
    temperatureHigh?: number,
    temperatureHighTime?: UnixTimeStamp,
    temperatureLow?: number,
    temperatureLowTime?: UnixTimeStamp,
    temperatureMax?: number,
    temperatureMaxTime?: UnixTimeStamp,
    temperatureMin?: number,
    temperatureMinTime?: UnixTimeStamp,
    uvIndexTime?: number,
    windGustTime?: UnixTimeStamp
}

type Alert = {
    description: string,
    expires: UnixTimeStamp,
    regions: Array<string>,
    severity: AlertSeverity,
    time: UnixTimeStamp,
    title: string,
    uri: URI
}

type UnixTimeStamp = number
type URI = string

type WeatherIcon = "clear-day"
    | "clear-night"
    | "rain"
    | "snow"
    | "sleet"
    | "wind"
    | "fog"
    | "cloudy"
    | "partly-cloudy-day"
    | "partly-cloudy-night";

type PrecipitationType = "rain"
    | "snow"
    | "sleet";

type AlertSeverity = "advisory"
    | "watch"
    | "warning";