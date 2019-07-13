export function setNumberInputElementValue (element: HTMLInputElement, value?: number) {
   if (value == undefined) {
      element.value = ""; }
    else {
      element.valueAsNumber = value; }}

export function getNumberInputElementValue (element: HTMLInputElement) : number | undefined {
   const v = element.valueAsNumber;
   return isNaN(v) ? undefined : v; }

export function getNumericUrlSearchParam (usp: URLSearchParams, paramName: string, defaultValue?: number) : number | undefined {
   const s = usp.get(paramName);
   if (!s) {
      return defaultValue; }
   const v = Number(s);
   if (!isFinite(v)) {
      return defaultValue; }
   return v; }

export function openSaveAsDialog (blob: Blob, fileName: string) {
   const url = URL.createObjectURL(blob);
   const element = document.createElement("a");
   element.href = url;
   element.download = fileName;
   const clickEvent = new MouseEvent("click");
   element.dispatchEvent(clickEvent);
   setTimeout(() => URL.revokeObjectURL(url), 60000);
   (<any>document).dummySaveAsElementHolder = element; }   // to prevent garbage collection

// Returns the greatest common divisor of an array with float numbers.
export function computeGcd (a: number[]) : number | undefined {
   const n = a.length;
   if (n == 0) {
      return; }
   let x: number|undefined = a[0];
   for (let i = 1; i < n; i++) {
      x = computeGcd2(x, a[i]);
      if (x == undefined) {
         return; }}
   return x; }

function computeGcd2 (v1: number, v2: number) : number | undefined {
   const eps1 = 1E-4;
   const eps2 = 1E-7;
   let a: number;
   let b: number;
   if (v1 > v2) {
      a = v1;
      b = v2; }
    else {
      a = v2;
      b = v1; }
   while (true) {
      if (b < eps1) {
         return; }
      const r = a % b;
      if (r < eps2) {
         return b; }
      a = b;
      b = r; }}
