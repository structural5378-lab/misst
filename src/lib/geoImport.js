// Parses GIS files (.geojson/.json/.gpx/.kml/.kmz) into a GeoJSON FeatureCollection.
import { gpx, kml } from "@tmcw/togeojson";
import JSZip from "jszip";

function dom(text, type = "application/xml") {
  return new DOMParser().parseFromString(text, type);
}

export async function parseGeoFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".geojson") || name.endsWith(".json")) {
    return JSON.parse(await file.text());
  }
  if (name.endsWith(".gpx")) {
    return gpx(dom(await file.text()));
  }
  if (name.endsWith(".kml")) {
    return kml(dom(await file.text()));
  }
  if (name.endsWith(".kmz")) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const kmlEntry = Object.keys(zip.files).find((f) => f.toLowerCase().endsWith(".kml"));
    if (!kmlEntry) throw new Error("No .kml file found inside the KMZ archive.");
    const text = await zip.files[kmlEntry].async("string");
    return kml(dom(text));
  }
  throw new Error("Unsupported file format. Use GeoJSON, GPX, KML, or KMZ.");
}

// Flatten a FeatureCollection into an array of { lat, lon, props } points,
// useful for importing waypoints / repeaters. Polygons/lines are skipped here.
export function fcToPointList(fc) {
  const out = [];
  const feats = fc?.features ? fc.features : Array.isArray(fc) ? fc : [];
  for (const ft of feats) {
    const g = ft.geometry;
    const p = ft.properties || {};
    if (!g) continue;
    if (g.type === "Point") out.push({ lat: g.coordinates[1], lon: g.coordinates[0], props: p });
  }
  return out;
}