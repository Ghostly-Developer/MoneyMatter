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

