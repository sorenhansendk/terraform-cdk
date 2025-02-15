import { QueryableStack, TestDriver } from "../../test-helper";
import * as path from "path";
import * as fs from "fs-extra";

describe("full integration test", () => {
  let driver: TestDriver;

  beforeAll(async () => {
    driver = new TestDriver(__dirname);
    await driver.setupPythonProject();

    // use generated custom bindings
    fs.copySync(
      path.resolve(
        __dirname,
        "..",
        "..",
        "edge-provider-bindings",
        "python",
        "edge"
      ),
      path.resolve(driver.workingDirectory, "imports", "edge")
    );

    await driver.synth("fixed");
  });

  describe("ReferenceStack", () => {
    let stack: QueryableStack;
    beforeAll(() => {
      stack = driver.synthesizedStack("reference");
    });

    it("renders plain values in lists", () => {
      const l = stack.byId("list");

      // Normal list
      expect(l.req[0].reqbool).toBe(true);
      expect(l.req[1].reqbool).toBe(false);
      expect(l.req[0].reqnum).toBe(1);
      expect(l.req[1].reqnum).toBe(0);
      expect(l.req[0].reqstr).toBe("reqstr");
      expect(l.req[1].reqstr).toBe("reqstr2");

      // Single item list
      expect(l.singlereq.reqbool).toBe(true);
      expect(l.singlereq.reqnum).toBe(1);
      expect(l.singlereq.reqstr).toBe("reqstr");
    });

    it("references plain values", () => {
      expect(stack.byId("plain").str).toEqual(
        "${optional_attribute_resource.test.str}"
      );
      expect(stack.byId("plain").num).toEqual(
        "${optional_attribute_resource.test.num}"
      );
      expect(stack.byId("plain").bool).toEqual(
        "${optional_attribute_resource.test.bool}"
      );
      expect(stack.byId("plain").strList).toEqual(
        "${optional_attribute_resource.test.strList}"
      );
      expect(stack.byId("plain").numList).toEqual(
        "${optional_attribute_resource.test.numList}"
      );
      expect(stack.byId("plain").boolList).toEqual(
        "${optional_attribute_resource.test.boolList}"
      );
    });

    it("item references a required single item lists required values", () => {
      const item = stack.byId("from_single_list");

      expect(item.bool).toEqual(
        "${list_block_resource.list.singlereq[0].reqbool}"
      );
      expect(item.str).toEqual(
        "${list_block_resource.list.singlereq[0].reqstr}"
      );
      expect(item.num).toEqual(
        "${list_block_resource.list.singlereq[0].reqnum}"
      );
      expect(item.boolList).toEqual([
        "${list_block_resource.list.singlereq[0].reqbool}",
      ]);
      expect(item.strList).toEqual([
        "${list_block_resource.list.singlereq[0].reqstr}",
      ]);
      expect(item.numList).toEqual([
        "${list_block_resource.list.singlereq[0].reqnum}",
      ]);
    });

    it.skip("item references required values from multi-item lists", () => {
      const item = stack.byId("from_list");

      // Direct access is not supported, we have to go through terraform functions
      expect(item.bool).toEqual(
        '${lookup(element(list_block_resource.list.req, 0), "reqbool", false)}'
      );
      expect(item.str).toEqual(
        '${lookup(element(list_block_resource.list.req, 0), "reqstr", "fallback")}'
      );
      expect(item.num).toEqual(
        '${lookup(element(list_block_resource.list.req, 0), "reqnum", 0)}'
      );
      expect(item.boolList).toEqual([
        '${lookup(element(list_block_resource.list.req, 0), "reqbool", false)}',
      ]);
      expect(item.strList).toEqual([
        '${lookup(element(list_block_resource.list.req, 0), "reqstr", "fallback")}',
      ]);
      expect(item.numList).toEqual([
        '${lookup(element(list_block_resource.list.req, 0), "reqnum", 0)}',
      ]);
    });

    it.skip("item references a required single item list", () => {
      const item = stack.byId("list_reference");

      // Expands single item references
      expect(item.singlereq).toMatchInlineSnapshot(`
        Object {
          "computedbool": "\${list_block_resource.list.singlereq[0].computedbool}",
          "computednum": "\${list_block_resource.list.singlereq[0].computednum}",
          "computedstr": "\${list_block_resource.list.singlereq[0].computedstr}",
          "optbool": "\${list_block_resource.list.singlereq[0].optbool}",
          "optnum": "\${list_block_resource.list.singlereq[0].optnum}",
          "optstr": "\${list_block_resource.list.singlereq[0].optstr}",
          "reqbool": "\${list_block_resource.list.singlereq[0].reqbool}",
          "reqnum": "\${list_block_resource.list.singlereq[0].reqnum}",
          "reqstr": "\${list_block_resource.list.singlereq[0].reqstr}",
        }
      `);
    });

    it.skip("item references a required multi item list", () => {
      const item = stack.byId("list_reference");

      // Expands single item references
      expect(item.req).toEqual("${list_block_resource.list.req}");
    });

    it("list attribute uses reference of single-item list", () => {
      const item = stack.byId("list_literal");

      // Expands single item references
      expect(item.req[0]).toMatchInlineSnapshot(`
        Object {
          "computedbool": "\${list_block_resource.list.singlereq[0].computedbool}",
          "computednum": "\${list_block_resource.list.singlereq[0].computednum}",
          "computedstr": "\${list_block_resource.list.singlereq[0].computedstr}",
          "optbool": "\${list_block_resource.list.singlereq[0].optbool}",
          "optnum": "\${list_block_resource.list.singlereq[0].optnum}",
          "optstr": "\${list_block_resource.list.singlereq[0].optstr}",
          "reqbool": "\${list_block_resource.list.singlereq[0].reqbool}",
          "reqnum": "\${list_block_resource.list.singlereq[0].reqnum}",
          "reqstr": "\${list_block_resource.list.singlereq[0].reqstr}",
        }
      `);
    });
  });
});
