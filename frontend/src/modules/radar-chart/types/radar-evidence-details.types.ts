export interface AreaEvidenceDetails {
  education: Array<{id:string;degree:string;institution:string;year:number|null;description?:string|null}>;
  certifications: Array<{id:string;name:string;issuer:string;year:number|null;credentialId?:string|null}>;
  experiences: Array<{id:string;position:string;companyName:string;duration:string;description?:string|null}>;
  tags: string[];
}
