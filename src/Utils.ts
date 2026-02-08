const dummyResolvedPromise = Promise.resolve();
const numberFormat = new Intl.NumberFormat("en-US");

export function nextTick (callback: () => void) {
   void dummyResolvedPromise.then(callback); }

export function catchError (f: Function, ...args: any[]) {
   void catchErrorAsync(f, ...args); }

async function catchErrorAsync (f: Function, ...args: any[]) {
   try {
      const r = f(...args);
      if (r instanceof Promise) {
         await r; }}
    catch (error) {
      console.log(error);
      alert("Error: " + error); }}

export function formatNumber (n: number | undefined, includeSign: boolean = false) : string {
   if (n === undefined || !isFinite(n)) {
      return ""; }
   const plusSign = (includeSign && n > 0) ? "+" : "";
   return plusSign + numberFormat.format(n).replace(/,/g, "\u202F"); }

// Returns undefined if the string does not contain a valid number.
export function decodeNumber (s: string) : number | undefined {
   if (!s) {
      return undefined; }
   const n = Number(s.replace(/[\u{2000}-\u{20FF}]/gu, ""));
   return isFinite(n) ? n : undefined; }

export function getNumericUrlSearchParam (usp: URLSearchParams, paramName: string, defaultValue?: number) : number | undefined {
   const s = usp.get(paramName);
   if (!s) {
      return defaultValue; }
   const v = Number(s);
   if (!isFinite(v)) {
      return defaultValue; }
   return v; }

export function openSaveAsDialog (data: ArrayBuffer, fileName: string, mimeType: string, fileNameExtension: string, fileTypeDescription: string) {
   if ((<any>window).showSaveFilePicker) {
      catchError(openSaveAsDialog_new, data, fileName, mimeType, fileNameExtension, fileTypeDescription); }
    else {
      openSaveAsDialog_old(data, fileName, mimeType); }}

async function openSaveAsDialog_new (data: ArrayBuffer, fileName: string, mimeType: string, fileNameExtension: string, fileTypeDescription: string) {
   const fileTypeDef: any = {};
   fileTypeDef[mimeType] = ["." + fileNameExtension];
   const pickerOpts = {
      suggestedName: fileName,
      types: [{
         description: fileTypeDescription,
         accept: fileTypeDef }]};
   let fileHandle: FileSystemFileHandle;
   try {
      fileHandle = await (<any>window).showSaveFilePicker(pickerOpts); }
    catch (e) {
      if (e.name == "AbortError") {
         return; }
      throw e; }
   const stream /* : FileSystemWritableFileStream */ = await (<any>fileHandle).createWritable();
   await stream.write(data);
   await stream.close(); }

function openSaveAsDialog_old (data: ArrayBuffer, fileName: string, mimeType: string) {
   const blob = new Blob([data], {type: mimeType});
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
