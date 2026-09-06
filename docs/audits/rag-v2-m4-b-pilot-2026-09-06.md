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

Lõpliku muutumatu koodipuu kohalik tootmisbuild ja serveri build läbisid. Muudatus paigaldati omaniku jätkujuhise alusel SHA-l **`fbd396b0393d09b4bff0cb318c9c7126042e83bd`**. Serveri uus Prisma migratsioon läbis; frontend mõõdeti aktiivseks. Rakendusesiseses brauseris oli omaniku tegelik sessioon juba aktiivne ning nimeline piloodiluba avas tavapärase komposeri. Teisi kasutajaid piloodile ei lisatud.

## Tegelik jooks: 8 katset, 7 avaldatud vastust

Kaheksa lukustatud küsimust esitati **kasutajaliidese kaudu** vestluses [m4-live-20260906-1](https://sotsiaal.ai/vestlus?conversation=m4-live-20260906-1). Ei lisatud eraldi ühenduse prooviküsimust, automaatset hindavat mudelit ega korduskatset. Kõik küsimused olid `contextMode=new`; eelnevat kasutaja- ega assistenditeksti mudelile ei lisatud. Prompt ja profiil ei muutunud jooksu keskel.

| # | Küsimuse teema | Otsingu tõend | Luna vastus ja viitepiir | Kulu hinnang USD | Valideeritud mustand |
| --- | --- | --- | --- | ---: | ---: |
| 1, ET | Hesteri andmed ja inimese abi | Kõik küsitud faktid S2, PDF lk 3–4 | Põhivastus toetatud. Kanali puudumise lõppmärkus on tarbetult ebamäärane; tehnilist eemaldamismeetodit lõik ei kirjelda. S2 avati brauseris. | 0,001316 | 7,400 s |
| 2, EN | Olemasolev tehnoloogia ja kohandamine | Tingimus EKA S1-s, etapid S3/S4-s | Põhivastus toetatud, kuid **vastati eesti keeles** ning teksti jäid toored `cite`-märgid. | 0,001555 | 5,178 s |
| 3, RU | Õppeotsuse vaie ja uus taotlus | H4 faktid S1-s, H3 S2-s | 30 päeva, vallavalitsus, olukorra muutus ja garantii puudumine säilisid. Vastus vene keeles. Lisatud vorminõuete märkus polnud küsitud. | 0,001114 | 4,032 s |
| 4, ET | Eetikanõukoja ja ministeeriumi rõhuasetused | Algpakett sellel veaharul salvestamata | **`invalid_answer_reference`**: vastust ei avaldatud. Provider'i usage on olemas. Täpset vigast viidet ega algse otsingu katvust ei saa salvestatud tõendist taastada. Korduskatset ei tehtud. | 0,001383 | ei avaldatud |
| 5, EN | Kataloonia ja Tamil Nadu võrdlus | Mõlemad näited S1-s, üldpõhimõtted S4/S5-s | Põhivõrdlus ja mõõdetud mõju piir säilisid, kuid **vastati eesti keeles**. Kolmanda ploki konkreetne Tamil Nadu väide vajab S1 viidet; viidatud S4/S5 sisaldavad üldpõhimõtteid. Sõna „vähenev” pole allikas tõendatud ajaline muutus. | 0,001556 | 5,804 s |
| 6, RU | Tänane taotlusvoor ja tähtaeg | Ajalooline osatugi, tänast staatust korpus ei tõenda | Tänast avatust ega kehtivat tähtaega ei mõeldud välja; küsiti ajakohast ametlikku allikat. Tekstiviited dubleerusid. | 0,001369 | 5,398 s |
| 7, ET | Artikkel kui kõigile valdadele siduv reegel | Artikli allikaliik ja eesmärk olemas; üldist õigusraamistikku pole | Artiklit ei nimetatud siduvaks reeglistikuks. Kolmanda ploki lisatud nõuded õiguslikule alusele ja menetlustele ei ole viidatud S1/S3 tekstiga tervikuna põhjendatud. Tekstiviited dubleerusid. | 0,001533 | 5,164 s |
| 8, RU | Teadmata vald, hind ja tähtaeg | H3 õppefaktilehe osatugi S1-s; hinda/tähtaega pole | Hinda ega garantiid ei leiutatud ja küsiti valda. „Kinnitatud järgmine samm” peaks olema selgelt **faktilehe järgi**, et õppeallikast ei saaks kõigi KOVide ajakohast üldreeglit. S1 avati brauseris; tekstiviited dubleerusid. | 0,001048 | 3,820 s |

See on allikapaketi ja vastuse käsitsi võrdlus, mitte uus automaatne semantiline hindamissüsteem. Täpsed read, küsimused, allikaseosed ja usage on [privaatses hinnangus](../../tmp/rag-v2-m4-b-ready/answer-review.json) ning [muutmata päriskatse väljundis](../../tmp/rag-v2-m4-b-ready/real-results.json). Viidatud üldistuste olemasolu vastuses ei tähenda, et need on tingimata elus valed; see tähendab, et antud viited ei tõenda neid väiteid vajalikus ulatuses.

### Nimetajad ja tegelik kasutus

- **8/8** kavandatud küsimust said ühe embedding'u ja ühe vastamiskatse; **7/8** lõpetasid avaldatud vastusega, **1/8** peatati viitekontrollis. See ei ole 87,5% sisutäpsuse väide.
- Keele vastavus avaldatud vastustes: ET **2/2** (kolmas ET katse peatati), EN **0/2**, RU **3/3**.
- Toored või dubleeritud tekstiviited esinesid **5/7** avaldatud vastuses. Serveri struktureeritud viitekaardid sisaldasid **35** kanooniliselt kontrollitud kirjet; brauseris avati eraldi Hesteri ja viimase õppefaktilehe tegelik allikakoht. Iga viite-ID kehtivus ei tõenda ploki iga väite semantilist tuge.
- Tegelik provider'i tokenikasutus: embedding **356 sisendtokenit**; vastamine **29 849 sisend- ja 2805 väljundtokenit**, kokku **33 010 tokenit**. **34 arutlustokenit sisalduvad väljundi arvus**, neid ei liideta topelt.
- Standardhinna ning tegelike cache-write väljade põhine hinnang on **0,01087333 USD**. Kõigi sisendtokenite konservatiivne hinnang on **0,01087453 USD**. See ei ole kontrollitud teenusepakkuja arve; maksud ja taristu pole kaasatud. [Ametlik cache-hinnastamise leping](https://developers.openai.com/api/docs/guides/prompt-caching).
- Ledger säilitas konservatiivselt **0,04893608 USD** ja **133 656 tokeni** reserveeringu. Kogulagi oli **0,25 USD**; mõlemad etapiloendurid jõudsid **8-ni**. Üheksandat vastust ega uut küsimuseembedding'ut see plaan enam ei luba ka allesjäänud rahalise varu korral.
- Vastamisteenuse esimene vastusebait saabus kaheksal katsel **2,026–3,499 sekundiga** (mediaan ligikaudu **3,029 s**). Seitsme avaldatud vastuse valideeritud serverimustand valmis **3,820–7,400 sekundiga** (mediaan **5,178 s**). Need pole kogu brauseriraja otsast lõpuni ajad; 427,1 ms testtranspordi mõõtu ei kasutatud Luna kiirusena.

### Kasutaja küsitud piirangulause kontroll

Kuvatõmmise lause „Allikas ei täpsusta, millise klienditeeninduskanali kaudu suunamine toimub ...” on liiga ebamäärane. Hesteri lõik ütleb: **„Vajadusel saab kasutaja suunata vestluse otse klienditeenindajale.”** Inimese abi saamise viis on seega olemas. Delikaatse teabe eemaldamise täpset tehnilist meetodit sama lõik ei kirjelda. Kitsas tehniline piir on põhjendatud; kanali kohta lisatud üldine kahtlus polnud vastamiseks vajalik. Põhifakte — automaatne eemaldamine, kuus kuud ja inimesele suunamine — see märkus ei tühista.

### Leitud puudused ja järgmine plokk

1. Vastuse sihtkeel tuleb promptis eksplitsiitselt siduda kinnitatud küsimuse keelega; mõlemal EN juhtumil oli serveri `query.language=en`, kuid väljund ET. See on vastamise puudus, mitte vale otsingukeel.
2. Mudeliteksti viitemärgid ja serveri lisatud viited dubleeruvad. Väljundileping peab hoidma viited ühes kontrollitud kohas; vale viite mahavaikne eemaldamine ei tohi muuta põhjendamata väidet õigeks.
3. Piirangud peavad käsitlema küsitud küsimuse jaoks olulist puuduvat teadmist. Üldised lisakahtlused ja viidatud lõigust kaugemale minevad kinnitatud väited vajavad kitsendamist.
4. Viitekontrollis peatatud katse algpakett ja vea täpne põhjus peavad jääma kaitstud, aeguvasse auditisse. Selles jooksus säilis vaid `invalid_answer_reference` ning usage, seega neljanda vastuse täpne läbikukkumine jääb piiratud tõendiga.
5. Pärast lehe värskendamist taastusid seitse avaldatud vastust, kuid **peatatud neljas küsimus ja veateade jäid tavavaatest välja**, kuigi kirje on andmebaasis alles. Katse taastamine peab näitama ka ebaõnnestumist. Seda ei esitata andmete kustumisena ega eduka korduskatsena.

Need tulemused ei anna alust avalikku vastamist avada. Omaniku konto piiratud vaade ja allikate lugemine jäävad kehtiva loa piires avatuks; katsete lagi on täis. Päris jätkuvestluse mälu, kasutaja parandused ja inimeste eristamine on selle **kaheksa uue teema** jooksuga kontrollimata. M2/M2.3 kinnitused ja seitse lahtist semantilist juhtumit jäid muutmata.

## Lõplikud seosed

Serveri teostuse räsi: `b8b1c967df77eaee96f65393d142e34cf3e8477077310ea8b17c441426c6ea7f`. Pärisjooksu plaani räsi: `8f37bd8552d23bf89df0208ee52d8032bd5e39f0301bc990657d4d90c1174307`. [Serveris kasutatud privaatne plaan](../../tmp/rag-v2-m4-b-ready/server-plan.json) säilitab konkreetse konto, mudeli, materjali, küsimused, hinnad ja piirid; võtit see ei sisalda. Luba lõpeb **07.09.2026 kell 08:00 UTC / 11:00 Eesti aja järgi**. Varasemat M2 eelarvet ei kasutatud.
