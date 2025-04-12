export type Event = {
  category?: string | null
  date: string
  time?: string
  relative?: string
  title: string
  notes: string
  accentHue?: string | null
}

export type Range = {
  category?: string | null
  fromDate: string | [string, string]
  toDate: string | [string, string]
  fromTime?: string | [string, string]
  toTime?: string | [string, string]
  fromRelative?: string | [string, string]
  toRelative?: string | [string, string]
  title: string
  notes: string
  accentHue?: string | null
}

type Dataset = {
  events?: {
    [eventId: string]: Event
  }
  ranges?: {
    [rangeId: string]: Range
  }
}

type UserDataWithoutDatasetMeta = {
  [categoryId: string]: Dataset
}

export type UserData = UserDataWithoutDatasetMeta & {
  datasets: {
    [datasetId: string]: {
      name: string
      categories: {
        [categoryId: string]: {
          name: string
          accentHue?: number | string
        }
      }
    }
  }
}
