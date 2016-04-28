# States

This data module is responsible for creating the 'states' mongodb collection.

A 'state' doc looks something like this:

    {
      _id: ObjectId("1234"),
      name: 'california',
      code: '01',
      geoId: 'abc123',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [...]
      },
      modified: ISODate("2016-04-26T00:22:51.293Z"),
      created: ISODate("2016-04-26T00:22:51.293Z")
    }

See `server/models/state.js` for more details.

### Usage
* Download the GeoJSON data for all US States from [this data source](http://eric.clst.org/Stuff/USGeoJSON).
  * In the terminal, `cd` to the `data/states` directory and run `curl -o states.json http://eric.clst.org/wupl/Stuff/gz_2010_us_040_00_20m.json`
* The states can be added to your local database or the production database via the `states.create` script.
  * In the terminal, `cd` to the `data/states` directory and run `node states.create local` or `node states.create production`.