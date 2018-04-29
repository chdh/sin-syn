// Sine synthesizer support functions.

import {ComponentParms} from "./SinSynGen";

export function parseComponentParmsString (s: string) : ComponentParms[] {
   let p = 0;
   let components: ComponentParms[] = Array(0);
   let lastAbsoluteFrequency = 1;
   while (true) {
      skipBlanks();
      if (p >= s.length) {
         break; }
      let frequencyIsRelative = false;
      if (s[p] == '*') {
         frequencyIsRelative = true;
         p++; }
      let frequency = parseNumber();
      if (frequency < 0) {
         throw new Error("Negative frequency value in components string."); }
      if (frequencyIsRelative) {
         frequency *= lastAbsoluteFrequency; }
       else {
         lastAbsoluteFrequency = frequency; }
      skipBlanks();
      let amplitude = 0;
      let phase = 0;
      if (s[p] == "/") {
         p++;
         skipBlanks();
         amplitude = parseNumber();
         skipBlanks();
         if (s[p] == "/") {
            p++;
            skipBlanks();
            phase = parseNumber(); }}
      const component: ComponentParms = {frequency, amplitude, phase};
      components.push(component);
      skipBlanks();
      if (s[p] == ",") {
         p++; }}
   return components;
   //
   function skipBlanks() {
      while (p < s.length && s[p] == " ") {
         p++; }}
   //
   function parseNumber() : number {
      const p0 = p;
      if (s[p] == "+" || s[p] == "-") {
         p++; }
      while (p < s.length) {
         const c = s[p];
         if (!(c >= "0" && c <= "9" || c == ".")) {
            break; }
         p++; }
      const x = decodeNumber(s.substring(p0, p));
      if (!isFinite(x)) {
         throw new Error("Syntax error in components string. Number expected at position " + (p0 + 1) + "."); }
      return x; }}

function decodeNumber (s: string) : number {
   if (!s) {
      return NaN; }
   return Number(s); }
