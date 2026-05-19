export const HOME_AIRPORT = 'Москва (SVO)'

export interface Airline {
  code: string
  name: string
  aircraft: string[]
}

export const AIRLINES: Airline[] = [
  {
    code: 'SU',
    name: 'Аэрофлот',
    aircraft: ['Airbus A320', 'Airbus A321', 'Airbus A330-300', 'Boeing 737-800', 'Sukhoi Superjet 100'],
  },
  {
    code: 'U6',
    name: 'Уральские авиалинии',
    aircraft: ['Airbus A319', 'Airbus A320', 'Airbus A321'],
  },
  {
    code: 'DP',
    name: 'Победа',
    aircraft: ['Boeing 737-800'],
  },
  {
    code: 'S7',
    name: 'S7 Airlines',
    aircraft: ['Airbus A320neo', 'Airbus A321neo', 'Embraer E170'],
  },
  {
    code: 'N4',
    name: 'Nordwind Airlines',
    aircraft: ['Boeing 737-800', 'Airbus A321', 'Boeing 777-200'],
  },
  {
    code: 'IO',
    name: 'IFly',
    aircraft: ['Boeing 767-300ER', 'Airbus A321'],
  },
  {
    code: 'R3',
    name: 'Якутия',
    aircraft: ['Boeing 737-700', 'Sukhoi Superjet 100'],
  },
]
