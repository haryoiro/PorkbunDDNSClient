import { _, cron, yargs } from "./deps.ts";

export type DnsRecordType =
  | "A"
  | "MX"
  | "CNAME"
  | "ALIAS"
  | "TXT"
  | "NS"
  | "AAAA"
  | "SRV"
  | "TLSA"
  | "CAA";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface DNSRecord {
  id: string;
  name: string;
  type: DnsRecordType;
  content: string;
  ttl: string;
  prio: string;
  notes: string;
}

export type ApiResponse = {
  status: "SUCCESS" | "ERROR";
  yourIp: string;
  message: string;
  records: Array<DNSRecord>;
};

export type PingResponse = Pick<ApiResponse, "status" | "yourIp" | "message">;
export type RetrieveResponse = Pick<ApiResponse, "records">;

export type ApiConfig = Pick<RequestBody, "apikey" | "secretapikey">;

export interface RequestBody {
  apikey: string;
  secretapikey: string;
  name: string;
  type: DnsRecordType;
  content: string;
  ttl: string;
}

class PorkbunDDNS {
  public publicIp: string | undefined;
  public endPoint;
  public domain: string | undefined;
  private keys: ApiConfig | undefined;

  constructor(endPoint: string, domain: string) {
    this.endPoint = endPoint;
    this.domain = domain;
    this.list();
  }

  private requestBuilder(
    body?: Partial<Omit<RequestBody, "apikey" | "secretapikey">>,
  ): RequestInit {
    return {
      method: "POST",
      cache: "no-cache",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...this.keys,
        ...body,
      }),
    };
  }

  public setApiKeys(keys: ApiConfig) {
    this.keys = keys;
  }

  public async ping() {
    try {
      const req = await this.requestBuilder();
      const res = await fetch(`${this.endPoint}ping`, req);
      const resJson: PingResponse = await res.json();
      return await resJson?.yourIp;
    } catch (e) {
      console.log(e);
    }
  }

  public async list() {
    const req = await this.requestBuilder();
    const res = await fetch(
      `${this.endPoint}/dns/retrieve/${this.domain}`,
      req,
    );
    const resJson: RetrieveResponse = await res.json();
    return await resJson.records;
  }

  public async findRecordsByName(name: string, type?: DnsRecordType) {
    const recordList = this.list();
    return (await recordList).find((d) => {
      return type ? d.name === name && d.type === type : d.name === name;
    });
  }
  public async findRecordById(id: string) {
    const recordList = this.list();
    return (await recordList).find((d) => {
      return d.id === id;
    });
  }

  public async updateRecord(
    id: string,
    record: Partial<RequestBody>,
  ) {
    const req = await this.requestBuilder(record);
    const currecord = await this.findRecordById(id);
    const subdomain = currecord?.name.split(".")[0];
    const res = await fetch(
      `${this.endPoint}/dns/editByNameType/` +
        `${this.domain}/${currecord?.type}/${subdomain}`,
      req,
    );
    return await res.json();
  }

  public async createDNSRecord() {
  }
}

const PorkbunApiEndpoint = "https://porkbun.com/api/json/v3/";

const run = async (configDNS: Arguments) => {
  try {
    const yourdomain = configDNS.domain;
    const ddns = await new PorkbunDDNS(PorkbunApiEndpoint, yourdomain);

    await ddns.setApiKeys({
      apikey: configDNS.apikey,
      secretapikey: configDNS.secret,
    });

    const currentIp = await ddns.ping() || "";

    const findedRecord = await ddns.findRecordsByName(
      configDNS.subdomain + configDNS.domain,
    );

    if (findedRecord?.id && findedRecord?.content !== currentIp) {
      const res: Response = await ddns.updateRecord(findedRecord?.id, {
        content: currentIp,
      });
      console.info(res.status);

      const updatedRecord = await ddns.findRecordById(findedRecord.id);
      console.info(updatedRecord);
      console.log("update succesed");
      return;
    } else {
      console.error("update skipped\n");
      return;
    }
  } catch (e) {
    console.error(e);
  }
};

interface Arguments {
  type: string;
  subdomain: string;
  domain: string;
  cron: string;
  secret: string;
  apikey: string;
}

let inputArgs: Arguments = yargs(Deno.args)
  .alias("s", "subdomain")
  .alias("d", "domain")
  .alias("c", "cron")
  .alias("k", "apikey")
  .alias("i", "secret").argv;

const errorMessages: { [k: string]: string } = {
  subdomain: "Provide your subdomain value using --subdomain [-s] parameter",
  domain: "Provide your domain value using --domain [-d] parameter",
  apikey: "Provide your Porkbun API key SID using --apikey [-k] parameter",
  secret:
    "Provide your Porkbun Secret API key SID using --secret [-i] parameter",
};

inputArgs = _.defaults(inputArgs, {
  apikey: Deno.env.get("PORKBUN_API_KEY"),
  secret: Deno.env.get("PORKBUN_SECRET_API_KEY"),
  cron: "* * * 1 * *",
  type: "A",
});
// deno-lint-ignore no-explicit-any
inputArgs = <any> _.pickBy(inputArgs, _.identity);

const errors: string[] = _.difference(_.keys(errorMessages), _.keys(inputArgs));
if (errors.length > 0) {
  errors.forEach((error) => console.log(errorMessages[error]));
  console.log(
    "\nProper program usage is:\ndeno run --allow-env --allow-net pddns.ts \\ \n-k <your api key> \\ \n-i <your secret> \\ \n-d example.com \\ \n-s sub ",
  );
  Deno.exit(1);
}

const configDNS = { ...inputArgs };

await run(configDNS);
cron(configDNS.cron, async () => {
  await run(configDNS);
});
