# Plată în cont — Pomi Fructiferi Online

## Activare

1. În Cloudflare, deschide Workerul API folosit pentru comenzile magazinului (`api.pomifructiferionline.ro`), nu Workerul de găzduire a site-ului.
2. Deschide `Worker_plata_in_cont.txt`, copiază tot codul și înlocuiește integral codul Workerului API. Apasă Deploy.
3. Păstrează variabilele și legăturile existente (ADMIN_TOKEN, DB și cele pentru e-mail/AWB). Nu trebuie schimbate.
4. În administrarea magazinului reîncarcă pagina complet, autentifică-te și apasă Actualizează.

Tabelul suplimentar pentru confirmările de plată se creează automat la prima utilizare autorizată; nu este necesară o comandă SQL manuală. Comenzile, produsele, observațiile clienților și AWB-urile existente nu sunt modificate de instalare.

## Utilizare

La comanda încasată integral, inclusiv transportul, bifează „Plată în cont — achitat integral” și apasă „Salvează plata”. Confirmă numai după verificarea încasării. Apare vizibil „PLATĂ ÎN CONT — ACHITAT INTEGRAL / RAMBURS: 0 LEI”.

Colega reîncarcă comenzile și vede același marcaj, inclusiv pe comanda imprimată. Valoarea comenzii rămâne neschimbată. Rambursul se introduce manual cu 0 lei în aplicația curierului; funcția nu modifică automat un AWB deja emis și nu verifică automat extrasul bancar. Nu folosi bifa pentru avansuri sau plăți parțiale.

Pentru anulare: debifează, salvează și confirmă anularea. Comanda afișează din nou rambursul integral. Dacă totalul comenzii s-a schimbat după confirmarea încasării, apare avertisment și trebuie verificată din nou plata. Dacă alt operator a modificat între timp marcajul, reîncarcă înainte de a salva.

## Verificări

- Teste automate pe bază SQLite izolată: autentificare, validare, salvare/citire, conflicte între operatori, anulare și total modificat.
- Teste funcționale ale interfeței: bifarea singură nu confirmă plata, salvarea reușită schimbă bannerul, eroarea nu afișează ramburs 0, imprimarea include marcajul salvat.
- Sintaxa ambelor fișiere JavaScript a fost verificată. Testarea vizuală într-un browser local nu a putut fi efectuată, deoarece browserul de test nu a fost disponibil.
- Nu s-au modificat comenzi reale și nu s-au emis AWB-uri în timpul testelor.
