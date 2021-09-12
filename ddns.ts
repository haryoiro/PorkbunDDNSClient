import { config, cron, parse } from "./deps.ts";

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

type DDNSConfig = Pick<DNSRecord, "type" | "content"> & {
  domain: string;
};

const PORKBUN_API_KEY = await config().apikey || "";
const PORKBUN_SECRET_API_KEY = await config().secretapikey || "";

const PorkbunApiEndpoint = "https://porkbun.com/api/json/v3/";

const run = async (configDNS: DDNSConfig) => {
  try {
    const yourdomain = configDNS.domain;
    const ddns = await new PorkbunDDNS(PorkbunApiEndpoint, yourdomain);

    await ddns.setApiKeys({
      apikey: PORKBUN_API_KEY,
      secretapikey: PORKBUN_SECRET_API_KEY,
    });

    const currentIp = await ddns.ping() || "";

    const findedRecord = await ddns.findRecordsByName(
      configDNS.content,
      configDNS.type,
    );
    // console.info(findedRecord);

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

const parsedArgs = parse(Deno.args);
const configDNS: DDNSConfig = {
  type: "A",
  content: "",
  domain: "",
};
if (parsedArgs.domain) {
  configDNS.domain = parsedArgs.domain;
}
if (parsedArgs.content) {
  configDNS.content = parsedArgs.content;
}
if (parsedArgs.type) {
  configDNS.type = parsedArgs.type;
}

cron("* * * 1 * *", async () => {
  await run(configDNS);
});
