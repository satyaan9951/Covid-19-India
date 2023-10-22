const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const sqlite3 = require("sqlite3");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DBError:${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * 
    FROM state;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((state) => {
      return convertStateObjectToResponseObject(state);
    })
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT * 
  FROM state
  WHERE state_id=${stateId};
  `;
  const stateDetails = await db.get(getStateQuery);
  response.send(convertStateObjectToResponseObject(stateDetails));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `
  INSERT INTO
  district (district_name,state_id,cases,cured,active,deaths)
  VALUES(
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
  );
  `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT * 
  FROM district
  WHERE district_id=${districtId};
  `;
  const districtDetails = await db.get(getDistrictQuery);
  response.send(convertDistrictObjectToResponseObject(districtDetails));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM 
    district
    WHERE 
    district_id=${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
  UPDATE district 
  SET 
  district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}
  WHERE 
  district_id=${districtId};
  `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
  SELECT
  cases,cured,active,deaths
  FROM district
  WHERE state_id=${stateId};
  `;
  const statsArray = await db.get(getStatsQuery);
  response.send({
    totalCases: statsArray.cases,
    totalCured: statsArray.cured,
    totalActive: statsArray.active,
    totalDeaths: statsArray.deaths,
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
  SELECT state_name
  FROM state JOIN district ON state.state_id=district.state_id
  WHERE district_id=${districtId};
  `;
  const stateNameObject = await db.get(getStateNameQuery);
  response.send({ stateName: stateNameObject.state_name });
});
module.exports = app;
