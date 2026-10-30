import { validatePlaceSearchInput } from '../src/utils/placeSearchInput'

// Wir importieren unsere bereits programmierte Funktion aus dem Frontend-Projekt.
// Sie prüft zum Beispiel, ob der Suchtext mindestens 3 und höchstens 120 Zeichen hat.
// Dieselbe Prüfung verwenden wir auch im Backend.

// Diese Hilfsfunktion erstellt eine HTTP-Antwort im JSON-Format.
// data: Die Daten, die wir an die App zurückschicken möchten.
// unknown: TypeScript erlaubt hier zunächst unterschiedliche Datentypen.
// status: Eine HTTP-Statusnummer, beispielsweise 200, 400 oder 503.
// : Response bedeutet, dass die Funktion ein Response-Objekt zurückgibt.
function jsonResponse(data: unknown, status: number): Response {
  // JSON.stringify() wandelt ein JavaScript-Objekt in einen JSON-Text um.
  // Beispiel: { status: 'ok' } wird zu '{"status":"ok"}'.
  return new Response(JSON.stringify(data), {
    // Übergibt die gewünschte HTTP-Statusnummer.
    status,

    // headers enthalten zusätzliche Informationen über die Antwort.
    headers: {
      // Teilt dem Empfänger mit, dass wir JSON-Daten schicken.
      'Content-Type': 'application/json; charset=utf-8',

      // Verhindert, dass diese Antwort zwischengespeichert wird.
      'Cache-Control': 'no-store',
    },
  })
}

// Cloudflare verwendet dieses exportierte Objekt als Einstiegspunkt.
// Wenn jemand unseren Server aufruft, führt Cloudflare die fetch-Methode aus.
export default {
  // request enthält die eingehende HTTP-Anfrage.
  // Request ist der TypeScript-Typ dieser Anfrage.
  // Response ist der Typ der Antwort, die unsere Methode zurückgeben muss.
  fetch(request: Request): Response {
    // request.url enthält die vollständige aufgerufene Adresse.
    // new URL() zerlegt sie in einzelne Bestandteile.
    //
    // Beispiel:
    // http://localhost:8787/api/search?q=Berlin
    //
    // url.pathname = '/api/search'
    // url.searchParams.get('q') = 'Berlin'
    const url = new URL(request.url)

    // Prüft, ob jemand den Gesundheitscheck unseres Servers aufruft.
    // === bedeutet: Beide Werte müssen exakt gleich sein.
    // && bedeutet: Beide Bedingungen müssen erfüllt sein.
    //
    // GET /health
    if (request.method === 'GET' && url.pathname === '/health') {
      // Antwortet mit HTTP 200 und {"status":"ok"}.
      // return beendet hier die Verarbeitung dieser Anfrage.
      return jsonResponse({ status: 'ok' }, 200)
    }

    // Prüft, ob die aufgerufene Adresse unsere Such-API ist.
    // !== bedeutet: Die Werte sind nicht gleich.
    //
    // Beispiel für einen unbekannten Pfad:
    // GET /api/unknown
    if (url.pathname !== '/api/search') {
      // HTTP 404 bedeutet: Diese Adresse existiert nicht.
      return jsonResponse({ error: 'notFound' }, 404)
    }

    // Für unsere Such-API erlauben wir aktuell nur GET-Anfragen.
    // Andere Methoden wie POST oder DELETE lehnen wir ab.
    if (request.method !== 'GET') {
      // HTTP 405 bedeutet: Diese HTTP-Methode ist nicht erlaubt.
      return jsonResponse({ error: 'methodNotAllowed' }, 405)
    }

    // Liest den Suchtext aus dem Parameter q in der URL.
    //
    // Beispiel:
    // /api/search?q=Damascus
    //
    // url.searchParams.get('q') gibt 'Damascus' zurück.
    // Fehlt q, erhalten wir null.
    //
    // Unsere Funktion prüft den Wert, bevor wir ihn verwenden.
    const result = validatePlaceSearchInput(url.searchParams.get('q'))

    // result.valid ist true, wenn die Eingabe gültig ist.
    // Das ! dreht den Wahrheitswert um:
    // !result.valid bedeutet also: Die Eingabe ist NICHT gültig.
    if (!result.valid) {
      // HTTP 400 bedeutet: Die Anfrage enthält ungültige Eingaben.
      // result.reason erklärt den Grund, zum Beispiel 'tooShort'.
      return jsonResponse({ error: result.reason }, 400)
    }

    // Bis hierhin ist die Anfrage gültig.
    //
    // Wir haben aber noch keinen geschützten Geoapify-Zugriff
    // und keinen gemeinsamen Tageszähler eingebaut.
    //
    // Deshalb führen wir absichtlich noch KEINE echte Suche aus.
    // HTTP 503 bedeutet: Der Dienst ist momentan nicht verfügbar.
    return jsonResponse({ error: 'searchNotReady' }, 503)
  },
}
