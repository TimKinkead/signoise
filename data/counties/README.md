# Counties

This data module is responsible for creating the 'counties' mongodb collection.

A 'county' doc looks something like this:

    {
      _id: ObjectId("1234"),
      name: 'alameda',
      state: ObjectId("1234"), // reference to state doc _id
      code: '01',
      geoId: 'abc123',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [...]
      },
      modified: ISODate("2016-04-26T00:22:51.293Z"),
      created: ISODate("2016-04-26T00:22:51.293Z")
    }

See `server/models/county.js` for more details.

### Usage
* Download the GeoJSON data for all US Counties from [this data source](http://eric.clst.org/Stuff/USGeoJSON).
  * In the terminal, `cd` to the `data/counties` directory and run `curl -o counties.json http://eric.clst.org/wupl/Stuff/gz_2010_us_050_00_20m.json`
* The counties can be added to your local database or the production database via the `counties.create` script.
  * In the terminal, `cd` to the `data/counties` directory and run `node counties.create local` or `node counties.create production`.