import { expect } from "chai";
import { Database } from "../arangojs";

const ARANGO_VERSION = Number(process.env.ARANGO_VERSION || 30400);
const it34 = ARANGO_VERSION >= 30400 ? it : it.skip;

describe("Managing functions", function() {
  // create database takes 11s in a standard cluster
  this.timeout(20000);

  let name = `testdb_${Date.now()}`;
  let db: Database;
  before(async () => {
    db = new Database({
      url: process.env.TEST_ARANGODB_URL || "http://localhost:8529",
      arangoVersion: Number(process.env.ARANGO_VERSION || 30400)
    });
    await db.createDatabase(name);
    db.useDatabase(name);
  });
  after(async () => {
    try {
      db.useDatabase("_system");
      await db.dropDatabase(name);
    } finally {
      db.close();
    }
  });
  describe("database.listFunctions", () => {
    it34("should be empty per default", done => {
      db.listFunctions()
        .then(info => {
          expect(info).to.have.property("result");
          expect(info.result).to.be.instanceof(Array);
          expect(info.result).to.be.empty;
        })
        .then(() => done())
        .catch(done);
    });
    it34("should include before created function", done => {
      const name = "myfunctions::temperature::celsiustofahrenheit";
      const code = "function (celsius) { return celsius * 1.8 + 32; }";
      db.createFunction(name, code)
        .then(() => {
          return db.listFunctions().then(info => {
            expect(info).to.have.property("result");
            expect(info.result).to.be.instanceof(Array);
            expect(info.result.length).to.equal(1);
            expect(info.result[0]).to.eql({
              name,
              code,
              isDeterministic: false
            });
          });
        })
        .then(() => done())
        .catch(done);
    });
  });
  describe("database.createFunction", () => {
    it("should create a function", done => {
      db.createFunction(
        "myfunctions::temperature::celsiustofahrenheit2",
        "function (celsius) { return celsius * 1.8 + 32; }"
      )
        .then(info => {
          expect(info).to.have.property("code", 201);
          expect(info).to.have.property("error", false);
        })
        .then(() => done())
        .catch(done);
    });
  });
  describe("database.dropFunction", () => {
    it("should drop a existing function", done => {
      const name = "myfunctions::temperature::celsiustofahrenheit";
      db.createFunction(
        name,
        "function (celsius) { return celsius * 1.8 + 32; }"
      )
        .then(() => {
          return db.dropFunction(name).then(info => {
            if (ARANGO_VERSION >= 30400)
              expect(info).to.have.property("deletedCount", 1);
          });
        })
        .then(() => done())
        .catch(done);
    });
  });
});
