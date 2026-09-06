# M4-B: kaheksa dokumendi katse ja tavalise vestluslehe ühendus

06.09.2026. See aruanne jätkab M4-A tõendeid neid üle kirjutamata. Omanik täpsustas tööotsa: kasutada serveri olemasolevat OpenAI/RAG-seadistust, tavalist `sotsiaal.ai/vestlus` lehte ning rakendusesisest brauserit; omanik logib oma kontoga sisse ja agent esitab kaheksa lukustatud piloodiküsimust.

## Ettevalmistuse tõend

Kohalikus platvormist eraldatud `rag_v2_dev` PostgreSQL-is ja Qdrantis taastati **8 dokumenti / 69 indeksiüksust**. Kasutati olemasolevaid muutumatuid M1 versioone ja kahe varasema OpenAI-katse salvestatud pärisvektoreid. Iga üksuse täisteksti sisend, tokenileping, konfiguratsioon, manifest, legeri kirje ja vektoriräsi kontrolliti enne indeksikirjutusi. Uusi vektoreid ei tellitud. Varasemad neli PostgreSQL-i põlvkonda ja Qdranti kollektsioonide täpsed punktiarvud säilisid.

Taastatud põlvkond on täpselt plaanitud `search_generation_386d51771eff1ece99cc354144ea589736a4c36c18101847dc57d6e3665d4e6e`; uue nimega vana tähendust ei asendatud. Üks olemasoleva päris-päringuvektoriga otsing andis 40 kandidaadist 5 viidet ja 4420-tokenise kompaktse paketi; kõik viis viidet lahendati kanooniliselt. Pärismudelikutseid taastamisel 0. [Taastamise tõend](../../tmp/rag-v2-m4-b-ready/restoration-result.json), [sisendite ja vektoripäritolu kontroll](../../tmp/rag-v2-m4-b-ready/restore-preflight.json), [varasemad indeksid](../../tmp/rag-v2-m4-b-ready/previous-indexes.json).

Seejärel mõõdeti serverit: seal on sama kaheksa dokumendi põlvkond juba aktiivne. `/etc/sotsiaalai/frontend.env` sisaldab `OPENAI_MODEL=gpt-5.6-luna`, OpenAI projekti ja võtit. Võtit ei kopeeritud vestlusse, raportisse ega kohalikku plaani. Kasutaja kontrolliti serveri kasutajaregistri identiteedi järgi; kohalikul ja serveri kontol on erinev ID, seega piloodiluba seotakse serveri omaga. Vanade `RAG_*` parameetrite asemel loeb piloot kontrollitud RAG v2 ühendusfailist eraldi `RAG_V2_*` ühendused.

## Piiride ja kasutajavaate muudatus

Püsivas ühises ledgeris jõustuvad lisaks kogupiiridele **kuni 8 embedding'u ja 8 vastuse katset**. Kaheksa vastust pärast ühte cache'i jaoks loodud embedding'ut ei luba üheksandat vastust; ka üheksanda uue küsimuse embedding'u saatmine tõrjutakse. Puuduvate etapiloenduritega vana ledger peatab uue saatmise, mitte ei alusta nullist.

Nimeline serveripoolne luba avab komposeri olemasoleval `/vestlus` lehel. Klient kasutab sama sõnumivaadet ja allikapaneeli, kuid piloodipäring ei kanna kliendi ajalugu ega rolle. Pöörde võti säilib värskendamisel ilma toorküsimuse brauserisse salvestamiseta. Valideerimata mustand ei jõua valmisvastusena kuvale. Allikapaneeli link avaneb kaitstud `/chat-source` lehel samas sakis ning võimaldab naasta samasse vestlusse.

Kohalikus rakendusesiseses brauseris läbis sünteetilise konto tavaline sisselogimine → `/vestlus` küsimus → fikseeritud testvastus → „Vastuste allikad” → PDF lk 2–3 algtekst → tagasipöördumisel salvestatud vastuse taastamine. Kõnealune katse ei olnud Luna kvaliteedikatse.

## Kontrollid enne serverisse viimist

- Etapipiiride kaks sihttesti, loa-/konfiguratsioonitest ning tavalise chati adapteri ja värskendatava võtme kaks testi läbisid (5 eri testi, välismudelikutseid 0).
- Muutunud failide eslint läbis. Varasemaid 37 M4-A testi ei korratud tervikuna.
- Kaheksa dokumendi taastamise ja PostgreSQL/Qdranti runtime-kontroll läbis.
- Tavalise vestluslehe brauserirada läbis testtranspordiga.

Päriskatse tulemused, lõplik serveri SHA ja kasutus lisatakse pärast paigaldust ja tegelikke piloodiküsimusi. Pelk konto konfiguratsioon ei tõenda mudeli ühendust ega vastuste sisulist õigsust.
