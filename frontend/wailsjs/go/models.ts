export namespace income {
	
	export class Entry {
	    id: string;
	    name: string;
	    incomeStreamId: string;
	    monthYear: string;
	    day: string;
	    sourceType: string;
	    taxStatus: string;
	    bankAccount: string;
	    amount: number;
	    taxAmount: number;
	    deductions: number;
	    directories: string[];
	    // Go type: time
	    lastUpdated: any;
	
	    static createFrom(source: any = {}) {
	        return new Entry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.incomeStreamId = source["incomeStreamId"];
	        this.monthYear = source["monthYear"];
	        this.day = source["day"];
	        this.sourceType = source["sourceType"];
	        this.taxStatus = source["taxStatus"];
	        this.bankAccount = source["bankAccount"];
	        this.amount = source["amount"];
	        this.taxAmount = source["taxAmount"];
	        this.deductions = source["deductions"];
	        this.directories = source["directories"];
	        this.lastUpdated = this.convertValues(source["lastUpdated"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Stream {
	    id: string;
	    profileId: string;
	    name: string;
	    sourceType: string;
	    taxStatus: string;
	    bankAccount: string;
	    // Go type: time
	    lastUpdated: any;
	
	    static createFrom(source: any = {}) {
	        return new Stream(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.profileId = source["profileId"];
	        this.name = source["name"];
	        this.sourceType = source["sourceType"];
	        this.taxStatus = source["taxStatus"];
	        this.bankAccount = source["bankAccount"];
	        this.lastUpdated = this.convertValues(source["lastUpdated"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace profile {
	
	export class Profile {
	    id: string;
	    name: string;
	    color: string;
	    currency: string;
	    baseTheme: string;
	    themeColor: string;
	    isAdmin: boolean;
	    notifications: string[];
	
	    static createFrom(source: any = {}) {
	        return new Profile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.color = source["color"];
	        this.currency = source["currency"];
	        this.baseTheme = source["baseTheme"];
	        this.themeColor = source["themeColor"];
	        this.isAdmin = source["isAdmin"];
	        this.notifications = source["notifications"];
	    }
	}
	export class ProfileExport {
	    filename: string;
	    data: number[];
	
	    static createFrom(source: any = {}) {
	        return new ProfileExport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filename = source["filename"];
	        this.data = source["data"];
	    }
	}

}

