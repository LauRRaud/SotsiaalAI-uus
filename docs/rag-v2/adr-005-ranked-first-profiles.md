# ADR-005: põhileidude eelisjärjekorraga kontekstiprofiilid

Kuupäev: 05.09.2026. Alus: `CODEX_M2_3_KONTEKSTIVALIK_v0_1.md`.

## Otsus

Olemasolev `retrieve()` valib järjestatud seemned enne struktuurilaiendust. M2 mitme allika ajalooline `hybrid_structure` kasutas eraldi kolme seemne ja kahe lisanduse profiili. Seda tähendust ega `evaluateRetrieval()` ajaloolisi meetodeid ei muudeta.

`lib/rag-v2/search/profiles.js` kirjeldab olemasoleva valikufunktsiooni eksplitsiitseid versioonitud profiile. Kõigil on `selection_policy=ranked-first-nondisplacing-v1`, 40 kandidaati kanali kohta, `topK=finalLimit=5`, kuni viis üksust dokumendi kohta, 6000 tegeliku kompaktse esituse tokenit ning dokumenti tähistavate eelsiltide välistamine. Kompaktne esitus sisaldab allikaandmeid. RRF jääb `rrf-v1`, konstant 60; leksikaalne konfiguratsioon jääb `pg-simple-weighted-or-v1`.

| Profiil | Kanalivalik | Struktuur |
| --- | --- | --- |
| `hybrid-ranked-first-v1` | olemasolev hübriid | väljas |
| `vector-ranked-first-v1` | olemasolev vektor | väljas |
| `hybrid-ranked-first-neighbors-v1` | olemasolev hübriid | eksplitsiitselt sees, ainult vaba mahu korral |

Naabritega profiil ei reserveeri neile kohti. Põhileiud täidavad esmalt kuni viis kohta; seejärel võivad kuni kaheksa sammu ja kaks lisandust kasutada alles jäänud üksuse-, dokumendi- ja tokenimahtu. Õiguse tühistamine eemaldab ka juba valitud põhileiu. Kontrollid ning nähtavad `final_limit`, `document_cap`, `context_budget` ja duplikaadi põhjused jäävad olemasolevasse valikufunktsiooni. Puuduv või võõra versiooni üksus annab olemasoleva tervikluskontrolli vea.

Uut paralleelset valikualgoritmi ei lisata. Profiili koostaja keelab päringu kaudu mahupiiride ja meetodi vaikse ülekirjutamise; `assertProfileGeneration()` kontrollib järjestuse ja leksikaalse konfiguratsiooni sobivust. Olemasoleva kohaliku CLI ja hindaja vaikeseadeid ei muudeta. Uus M4 ühendus peab valima profiili nimeliselt; helperi vaikimisi hübriidprofiil ei ole M4 kandidaadi automaatne valik.

```javascript
const profile = retrievalProfile('vector-ranked-first-v1');
assertProfileGeneration(profile, generation);
const query = queryForProfile(profile, { text, language, filters, generation_id: generation.id });
// retrieve({ ...trustedDependencies, query, allowLexicalFallback: profile.allow_lexical_fallback })
```

Päringutekst ja ligipääsuulatus tulevad tulevasest serveri ühendusest. Rubriik, allikate õiged leheküljed, küsimuseperekonnad ning hindamissildid ei kuulu profiili ega runtime'i sisendisse.

## Korduv võrdlus

`scripts/rag-v2-selection-compare.mjs` kasutab samu salvestatud pärisotsingu kanalikandidaate, kanoonilisi kohalikke üksusi ja kontrollitud varasemaid päringuvektoreid. PostgreSQL-i ja Qdranti asemel tagastavad read-only kordusesituse adapterid just need fikseeritud nimekirjad. Tegelik valik toimub muutmata `retrieve()` kaudu. Väljaminev võrk on keelatud; uut indekseerimist, aktiveerimist ega embedding-kutset ei tehta.

```powershell
node scripts/rag-v2-selection-compare.mjs --output tmp/rag-v2-m2-3/uus-valikuvordlus
```

Väljund peab olema uus privaatne kaust. Enne uut profiili kontrollitakse kolme ajaloolise raja teksti, järjekorra ja kompaktse tokeniarvu täpset reproduktsiooni. Muutumatu kontekst kasutab sama perekonna olemasolevat sisuräsiga otsust. Uus kontekst jääb ülevaatusse ka siis, kui kinnitatud allikakomplekt leidub; tagastatakse ainult deduplitseeritud muudatusülevaatus.

Siin mõõdetud valikuaeg ei hõlma päristeenuste ega embedding'u latentsust. Tulemus on retrospektiivne arendus-/regressioonitõend. Meetodite koondist ei arvutata süsteemi üldist täpsust; bibliograafia ja korpuse teadmislüngad on eraldi väljad.

## M4 kandidaadi piir

05.09 piiratud võrdluses langes naabritega profiil kõigil 21 küsimusel kokku struktuurita hübriidiga. Naabrus ei andnud seal lisaväärtust ning jääb järgmise kasutusprofiili puhul välja. Vektoril oli 16 full / 2 partial / 1 absent / 2 needs_review, hübriidil 14 / 5 / 1 / 1; ühe küsimuse tõlked ei ole sõltumatud juhtumid.

Järgmise piiratud M4 sisepiloodi kandidaat on **`vector-ranked-first-v1`**, alternatiiv **`hybrid-ranked-first-v1`**. See on valimipõhine kandidaadivalik, mitte universaalse võitja väide. Profiili embedding-konfiguratsioon, korpuseviide ja koodiräsid on privaatses katselisandis. Enne uut valideerimist fikseeritakse uued juhtumid, nõuded, allikad ja profiil; kontrolli ei kasutata häälestamiseks.

M4 teostus, avaliku vestluse avamine, M3 semantilised sõltuvused, uued tasulised päringud ning tootmiskasutuse õiguste ühendus ei kuulu sellesse otsusesse.
