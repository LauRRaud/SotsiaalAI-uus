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


## 06.09.2026 järelparandus: kohalik teostus ja regressioon

**Kohalik parandusplokk on kontrollitud; uusi välismudelikutseid 0.** See osa lisab tõendid eelnevale pärisjooksule. Seitse algvastust, neljanda katse puuduv pakett/mustand, esialgsed hinnangud ja mõõtmised jäävad muutmata. Muudatused on põhikausta `main`-tööpuus; commit'i, push'i, deploy'd, tootmisteenuse restarti ega loa pikendamist selles voorus ei tehtud. Serverist loeti ainult selle sama kaheksa katse vektorite rässe ja loendureid. 06.09 kell 10:06 UTC mõõdetud serveri HEAD ning hiljem mõõdetud `origin/main` olid `3d61bfab2d9ed1c4ca2bc32795a7a8b6cc0d7a9b`.

### Viie puuduse kaart ja tulemus

| Aruande puudus | Muudetud rada | Kohalik tulemus ja piir |
| --- | --- | --- |
| Saatmiseelne pakett ja vigase vastuse diagnoos puudusid | `pilot/service.js`, `store.js`, `provider.js`, `contracts.js` | PASS: enne answer-reserveeringut/saatmist säilib täpne body, valitud pakett, viitekaart, küsimus/keel ja versioonid. Salvestustõrge annab 0 answer-kutset. Mustand, request ID, usage, veavälja asukoht ja lubatud viited säilivad kaitstult. Algset neljandat mustandit ei taastatud. |
| Peatatud küsimus kadus refresh'il | `m4PilotServer.js`, `m4PilotClientContract.js`, olemasolevad chati hook'id ja tõlkekataloogid | PASS: edukad, peatatud ja teadmata tulemusega pöörded taastuvad samas sõnumilepingus. Brauserile antakse küsimus ja lokaliseeritav veaseis, mitte mustand ega veaviite väärtus. |
| Toored/dubleeritud viited | `pilot/presentation.js` ja valideerija | PASS: plokisisesed kordused eemaldatakse, eri plokkide seosed säilivad. Uue väljundi tekstiviited tõrjutakse ka piirangutes/täpsustusküsimuses. Vana kuvakuju puhastatakse ainult tuntud lõpusüntaksi ja sama ploki kehtivate viidete korral. |
| EN küsimusele tuli ET vastus | `query.language → answerRequest → requestAudit` | PASS kohaliku transpordi ja nähtava ET/EN/RU teksti kohta. Prompt seob kõik vastuseosad serveri sihtkeelega; kanooniline allikatekst jääb algkeelde. Luna tegelik keelekuulekus: NOT_PROVEN. |
| Allikast kaugemale ulatuv väide või tarbetu piirang | Üldine vastamisprompt | Teostatud eristused: üksikjuhtum/üldpõhimõte, seisund/muutus, soovitus/kohustus, eesmärk/mõõdetud mõju, õppenäide/ajakohane üldreegel. Piirang peab mõjutama küsitud vastust; paketis puuduv detail ei tõenda kogu korpuse puudust. Sisuline mõju: NOT_PROVEN. |

Prompt on `m4-grounded-answer-2`; küsimuseleping jääb `m4-explicit-previous-user-1`. Väike vastuse kuju (`kind/blocks/limitations/clarification`, plokis `text/factual/refs`) säilib; käitumis- ja esitusversioon on `m4-text-refs-2`. Ajaloolist puuduva versiooniväljaga vastust loetakse `m4-text-refs-1` lepinguga. Sama renderdaja teenindab esmast vastust ja taastamist. Uued tõlkevõtmed on `m4Pilot.referenceFailed`, `answerFailed` ja `unknown`; kataloogid kuuluvad teostusmanifesti.

`requestAudit` sisaldab tegelikku päringukeha ja versioonisidemeid; `packet` ainult valitud tõendeid ja kanoonilisi seoseid, mitte kõiki kandidaate. Paketi piir on 512 000 UTF-8 baiti. `responseAudit` sisaldab ainult lõppväljundit, mitte varjatud arutlust; mustandi üle 65 536 baidi jääv osa kärbitakse märgise, algpikkuse ja räsiga. Kustutamine, arhiivimine, loa tühistamine ja aegumine kaitsevad ka auditit ning hilist kirjutust. Teadaolev avaldamiskontrolli viga on `answer_rejected`, teadmata teenusetulemus `unknown`, kontrollitud avaldamine `completed`; kulureservi ei vabastata. Varasem avaldamistehingu tõrke `needs_recovery` rada säilib.

Ajaloolise plaani lugemine on eraldatud uue saatmise teostuskinnitusest: vana plaani räsi, kasutaja, materjal ja aegumine kontrollitakse edasi. Vana teostuse lugemine ei anna uuele koodile saatmisluba. Uus saatmine nõuab praeguse teostuse kinnitatud plaani. Otsinguprofiili, põlvkonda, embedding-ruumi, mudelivalikut ega M2/M2.3 otsuseid ei muudetud.

### Selle vooru vastuvõtutõendid

**38 käivitatud eri sihttesti: PASS 38 / FAIL 0 / SKIP 0.** Nimetaja: 16 tuuma/provider'i/loa/esituse testi, 19 päris kohaliku PostgreSQL-i püsistustesti, üks tegeliku kohaliku HTTP raja test, üks ajaloolise taasesituse test ja üks olemasoleva kanoonilise viite sihttest. Muutunud lepingu järel korratud sihtteste topelt ei loeta. Varasema M4-A 37 testi tulemus jääb ajalooliseks.

| ID | Tulemus | Tõend |
| --- | --- | --- |
| F01 | PASS | Paketisalvestuse tõrge enne answer-reserveeringut: ainult juba tehtud embedding, answer-kutseid 0. |
| F02 | PASS | Sünteetiline `S99`: mustand, `$.blocks[0].refs[0]`, saadud viide, lubatud `[S1]`, request ID ja usage kaitstud kirjes; avaldatud sõnumeid 0. |
| F03 | PASS | Kanoonilise paketi/õiguste sihttest; HTTP-s vale viide, teise konto allikas ja peatatud pöörde allikas tõrjutakse. |
| F04 | PASS | Eraldi uus Node'i protsess taastab sama `answer_rejected` pöörde ilma otsingu- või teenuseadapterita. |
| F05 | PASS | Tegelik desktop-refresh ja 390 × 844 mobiili allikavaatelt naasmine: 4 küsimust, 3 vastust ja nende vahele jäänud 1 veapööre õiges järjekorras. |
| F06 | PASS | Teadaoleva usage'iga viiteviga loeb answer-etapipiiri; uus küsimus täis piiriga ei alusta embedding'ut. |
| F07 | PASS | Embedding'u ja eraldi answer-ühenduse teadmata tulemus säilitavad `unknown`, reservi ja korduskatse keelu; answer-haru algpakett on alles. |
| F08 | PASS | Loa tühistamine, kustutamise ajal saabuv vastus, arhiiv ja aegumine tõrjuvad taastamise/hilise kirjutuse; sisu kustutamine ei kustuta ledgerit. |
| F09 | PASS | Üheaegne sama võti annab ühe teenusekatse; pärast lõppseisu tehtud kaks HTTP korduspäringut taastavad sama vea ja jätavad loendurid muutmata. |
| F10 | PASS | Plokisisene viitekordus normaliseerub; sama viide teises plokis säilib; algobjekti ei muudeta. |
| F11 | PASS | Ainult tuntud `[S1]` / `citeS1` lõpusüntaks. Tundmatu või segatud märgend, lause keskel olev tähis ja sõna `cite` jäävad puutumata. |
| F12 | PASS | Uue ja ajaloolise lepingu sama renderdaja, tundmatu versiooni tõrje, originaali muutumatuse kontroll. |
| F13 | PASS kohalikult | Tegelik provider'i body ning ET/EN/RU nähtav põhitekst, piirang ja küsimus; ET liides ja allikas ei kirjuta EN/RU fixture-teksti üle. Pärismudeli osa NOT_PROVEN. |
| F14 | PASS kohalikult | Allikasisene võltsitud keele-/rollikäsk jääb user-JSONi andmeks; usaldatud juhis ja keel säilivad. Mudeli täielikku juhisesüstikindlust see ei tõenda. |
| F15 | PASS | 7 lubatud algvastust läbisid lokaalse taastamis-/renderduslepingu. Kuvakuju muutus 5 vastusel; lähtefaili räsi säilis. Algne neljas pakett/mustand endiselt NOT_PROVEN. |
| F16 | PASS | Vana 8-katse piir tõrjub üheksanda vastuse/uue embedding'u; ledger ei sõltu aruandekaustast. Uue plaani räsiga seotud vektoritaaskasutus ei muuda vana ledgerit, teise konto või arhiivitud/aegunud vektorit ei kasutata. Uus plaan annab praegu `pilot_approval_required`. |

Käivitatud failid: `tests/rag-v2-pilot-{core,provider,config,chat-adapter,store,http,replay}.test.mjs` ning `tests/rag-v2-pilot.test.mjs` üks `E-08/09` sihttest. Püsistustestid kasutavad ainult `sotsiaal_ai_m4_dev` andmebaasi, selgesõnalist `M4_TEST_DATABASE_URL` ja `TZ=UTC`; HTTP test nõuab localhosti ja seda isoleeritud DB-d. Taasesituse `M4_REPLAY_ARTIFACT` määrati olemasolevale lubatud originaalfailile. Teenusetransport on testides asendatud või keelatud.

Lõpliku koodipuu muudetud failide eslint **PASS**. `npm run build` koos sisemise `i18n:check` kontrolliga **PASS** (kompileerimine 30,2 s, protsess exit 0). Prisma skeemi ega migratsioone ei muudetud. `git diff --check` **PASS**. Build'i ei korrata järgneva raporti/S1 teksti pärast.

[HTTP tõendid](../../tmp/rag-v2-m4-followups/http-checks.json) ja [brauseri/DB koond](../../tmp/rag-v2-m4-followups/browser-checks.json): teise administraatori lugemine 403, anonüümne lugemine 401, võõras vestlus 403, vigane keha 400, võõras Origin 403, õige allikakoht 200. Käsitsi UI rada: EN edu → ET viiteviga → RU edu → ET edu → refresh → mobiili allikas → tagasi. Lõpus oli endiselt 4 test-embedding'ut ja 4 testvastuse katset, 0 välismudelikutset ning 0 USD. Mobiili dokument ja viewport olid mõlemad 390 px; privaatne mustand ei olnud DOM-is nähtav. Brauseris kontrolliti veateate ja kanoonilise allikateksti loetavust; protsessi restart on eraldi päris-DB test.

### Viitekuju ja sisuline piir

[Privaatne enne/pärast võrdlus](../../tmp/rag-v2-m4-followups/legacy-display-comparison.json) on eraldi tuletatud esitus. Näiteks algse EN-küsimuse ET-vastuse lõpp `citeS1S3 [S1, S3]` kuvab nüüd ühe `[S1, S3]`; `[S4][S5] [S4, S5]` kuvab ühe `[S4, S5]`. See ei muuda ET vastust ingliskeelseks, ei tõenda Tamil Nadu väite viite semantilist sobivust ega eemalda sõna „vähenev”. Need ja artikli õigusliku ulatuse / õppefaktilehe üldistamise probleemid jäävad ajaloolises tekstis nähtavaks. Algse neljanda vea asemel kasutati ainult selgelt sünteetilist `S99` viga.

### Üks uus, veel kinnitamata pärisregressiooniplaan

[Privaatne plaan](../../tmp/rag-v2-m4-followups/regression-plan.json), [kulureserv](../../tmp/rag-v2-m4-followups/regression-costs.json), [seitsme algpaketi võrdlusräsid](../../tmp/rag-v2-m4-followups/regression-packet-baselines.json) ja [teostusmanifest](../../tmp/rag-v2-m4-followups/regression-implementation.json). Genereerija `scripts/rag-v2-m4-regression-plan.mjs` teeb ainult kohalikku ettevalmistust: ei aktiveeri pilooti, kirjuta heakskiitu ega võta ühendust mudeliga.

- Samad **8 lukustatud küsimust** ja sama nimeline serverikonto, OpenAI projekt, `gpt-5.6-luna`, kaheksa dokumendi versioonipilt, profiil ning 6000-tokenine kompaktne kontekst. See on teadaolevate vigade regressioon. Uusi puutumatuid küsimusi ega jätkuvestlust sellesse jooksu ei lisata.
- **Kuni 8 uut vastamiskatset, 0 uut embedding'u kutset.** [Read-only inventuur](../../tmp/rag-v2-m4-followups/original-vector-inventory.json) leidis kõik 8 varasemat 3072-mõõtmelist küsimusevektorit. Uus luba seob täpsed pöörded, küsimuseräsid, embedding'u päringukehad ja vektoriräsid; konto, tenant, vana pöörde aegumine ja arhiiviseis kontrollitakse kasutamisel uuesti. Puuduv või muutunud vektor peatab katse. Uut embedding'u kvooti ei võeta automaatselt.
- Suurim konservatiivne vastamiskutsete reserv: **0,1476608 USD** (8 × 64 000 sisendtokeni ja 2048 väljundtokeni lagi). Seitsme allesoleva paketi tegelike uute body'de ning neljanda küsimuse täislae põhine reserv on **0,0644613 USD**. Kinnitamiseks kavandatud kogulagi: **0,16 USD**. Need on 06.09 plaani konservatiivsetel hindadel arvutatud reserveeringud, mitte arve lubadus.
- Kavandatud loa lõpp: **07.09.2026 08:00 UTC / 11:00 Eesti aja järgi**. Vana loa ega vektorite eluiga ei pikendata; kopeeritud vektori uue pöörde TTL ei ületa algse oma. Kui see aeg möödub enne kinnitatud jooksu, praegune plaan ei käivitu.
- Iga UI kaudu saadud uue paketi `model_context` ja kanoonilised seosed võrreldakse seitsme algpaketiga; genereeritud query-ID jäetakse sisuvõrdlusest välja. Erinev pakett märgitakse. Neljanda küsimuse uus pakett oleks uus tulemus, sest algpakett puudub.
- Hinnatakse eraldi keelt, põhivastust ja täielikkust, põhjendamata ulatust, tehnilist viidet, semantilist tuge, viitekuju, avaldamist, refresh'i, usage'it ja aega. Üks juhuslik kordus ei tõenda üldist kvaliteeti.

Plaan on `draft_not_authorized` ja `approval=null`. Puudu on omaniku **eraldi materjali-, mudeli/projekti-, katsetaja-, ajapiiri- ja 0,16 USD kogukulu kinnitus**, samuti luba push'iks/deploy'ks. Serverisse viimise järel tuleb kontrollida ülevaadatud failisisu vastavust ning serveri platvormipõhist teostusräsi; plaani muutuse korral ei saadeta midagi enne selle ülevaatust. Kohaliku plaani räsi ilma heakskiiduta: `ef36d561c9a7ba17f5a91b015d5a9c7ed34e4addd8892b89907cadeed03d5015`; teostusräsi: `8602770843531703820da1ff8e182f3e974c75ec53bfabbf6d9b6603808d31dd`. Algse piloodi ledger jääb 8/8 ja seda ei lähtestata.


## 06.09.2026 parandatud M4-B pärisregressioon — enne ja pärast

**Üks lubatud kaheksa küsimuse jooks on lõpetatud: 6 vastust avaldati, 2 peatati viitekontrollis.** Ingliskeelsed küsimused said nüüd ingliskeelsed vastused, avaldatud vastuste toored/dubleeritud viited kadusid ning mõlemad päriselt tekkinud veapöörded taastusid refresh'il. Avaldamise tulemus halvenes siiski 7/8-lt 6/8-le. M4 vastamisrada ei ole selle põhjal avalikuks kasutuseks vastu võetud.

Omaniku juhis „loe ja tegutse, raha ei ole tegelikult oluline jne” koos lisatud piiratud regressiooni ülesandega andis loa ülevaadatud muudatuste push'iks, paigaldamiseks ja plaani `m4-regression-20260906-1` üheks jooksuks. Uue plaani ülemine `authorizationBasis.scope` kirjeldab nüüd täpselt **8 vastamiskatset, 0 uut embedding'ut, 0,16 USD ja sama kehtivusaega**; vana 0,25 USD kirjeldus on ainult eelkäija ajaloolises loakirjes. [Tegelik kinnitatud serveriplaan](../../tmp/rag-v2-m4-regression-ready/server-plan.json) säilitab uue heakskiidu ja räsi. Varasem kinnitamata plaan ning algne pärisplaan jäid muutmata.

### Paigaldus ja muutumatu võrdlusalus

Ülevaadatud kood paigaldati commit'ilt **`e7532b8bab6913cd8b85b3c84b1f259a5cc9bd79`**. Sama kohaliku runtime-puu 38 testi, lint, i18n ja build olid eelmises plokis kontrollitud; neid ei korratud formaalselt. Parandati ainult plaanigeneraatori loakirjelduse eristus ning selle faili lint läbis. Serveri build läbis (32,6 s kompileerimine); pending migratsioone ei olnud ja frontend mõõdeti aktiivseks.

Serveri **75 runtime-faili** räsi võrreldi täpselt commit'i Git-blobidest arvutatud Linuxi failisisuga. Kõik vastasid. See lahendab Windowsi/Linuxi reavahetustest tuleneva kohaliku manifestiräsi erinevuse ilma koodimuutust varjamata. Serveri teostusräsi on `d4e7c0f158021daeb23f02a5254324ff3d93e850c8d37f9240a3f305b64ee63a`; kinnitatud uue plaani räsi `98cfb34d1db7a59cb9437176417bbf60c2959d34209e2bfb31c9c66e25f66163`. [Aktiveerimise tõend](../../tmp/rag-v2-m4-regression-ready/activation-result.json).

Sama nimeline konto, OpenAI projekt, `gpt-5.6-luna`, `low` reasoning, väljundlagi, kaheksa dokumendi versioonipilt, indeksipõlvkond ja `vector-ranked-first-v1` profiil säilisid. Enne saatmist kontrolliti uuesti kaheksa varasema vektori sisu/räsi, mõõtmeid, küsimuse identiteeti, konto- ja aegumispiiri ning aktiivset indeksit. Kõik kaheksa vektorit olid lubatud taaskasutuseks. Uusi embedding'u kutseid tehti **0**. Ühelegi teisele kontole vastamist ei avatud.

Kõik kaheksa küsimust esitati tavalise [regressioonivestluse](https://sotsiaal.ai/vestlus?conversation=m4-regression-live-20260906-1) kasutajaliideses, igaüks ühe uue teemana. Prompti, profiili ega koodi tulemuste vahel ei muudetud. Korduskatseid, paranduskutseid, varumudelit, hindavat mudelit ega lisatasulist veasüsti ei kasutatud.

**Seitsme allesoleva algpaketi puhul olid uue ja vana jooksu `model_context` ning kanoonilised viitesidemed võrdsed 7/7.** Viitekaartide võrdlusest eemaldati ainult genereeritud query-ID; teised seosed, kaasa arvatud dokumendiversioon, chunk, span'id, PDF-lehed ja teksti räsi, vastasid. Saatmiseelse body räsi vastas oma reserveeringule kõigil 8 katsel. Body sees oleva user-JSONi sisuvõrdlus arvestas PostgreSQL JSONB võtmejärjestuse muutumist; algsed päringu stringid on alles. [Tehniline võrdlus](../../tmp/rag-v2-m4-regression-ready/technical-comparison.json).

Neljas küsimus ei kuulu 7/7 paarisvõrdluse sisse: algne pakett puudub. Selle uus pakett ja veadiagnostika on uue katse tõend, mitte algse vea taastamine. Sama kaheksa küsimuse kordus näitab teadaolevate juhtumite regressiooni; ühe juhusliku korduse põhjal ei saa prompti mõju üldistatult või eraldi mudeli varieeruvusest põhjuslikult mõõta.

### Tulemused iga küsimuse kohta

| # | Teema | Enne | Pärast ja allikatoe hinnang |
| --- | --- | --- | --- |
| 1, ET | Hesteri andmed, säilitus ja inimese abi | 3 põhifakti olemas, ebamäärane kanali-piirang | Avaldatud. Kõik 3 põhifakti säilivad S2 toel. Tehnilise meetodi ja täpsete suunamistingimuste lõppmärkus on endiselt küsitu suhtes kõrvaline. Piirangute parandus on osaline. |
| 2, EN | Olemasolev tehnoloogia ja kohandamine | ET vastus ja toored viitemärgid | Avaldatud **EN** vastus, puhas viitekuju, põhieristus ja etapid säilivad. Teise ploki väide, et programm „brought together” osapooled, sõnastab viidatud S3 eesmärgi juba toimununa; S4-s on kohtumise tõend, kuid seda selles plokis ei viidata. Eesmärgi ja teostumise eristus vajab endiselt täpsust. |
| 3, RU | Õppeotsuse vaie ja uus taotlus | 30 päeva, vallavalitsus, muutunud olukord ja garantii puudumine; kõrvaline vormipiirang | Avaldatud RU vastus, põhitingimused säilivad ja õppenäide on selgelt nimetatud. Adressaat on nüüd üldisem „municipality”, kuigi H4 S1 ja vana vastus nimetasid vallavalitsust. Täpsus veidi vähenes; kõrvalised vormi/õiguse märkused säilisid. |
| 4, ET | Eetikanõukoja ja ministeeriumi rõhuasetused | Peatatud; algpakett/mustand puuduvad | **Peatatud.** Teine plokk kirjeldab tõendimaterjali puudumist, kuid on `factual=true`, `refs=[]`. Uues paketis on eetikanõukoja põhitekst S1–S3, pealkiri S4 ning lõpukatke S5; ministeeriumi põhikäsitlus ei ole võrdluseks piisavalt esindatud. Täpne uus viga ja osaline pakett on nüüd alles. |
| 5, EN | Kataloonia ja Tamil Nadu | ET vastus; konkreetne väide üldpõhimõtete viidetega, põhjendamata „vähenev” | Avaldatud **EN** vastus. Mõlemad juhtumid viitavad S1-le, süntees S1/S4/S5-le. Põhjendamata ajaline muutus puudub; osaluse kasu esitatakse võimaliku, mitte mõõdetud mõjuna. Põhivõrdlus paranes. Kastipõhise ebaõigluse eripära on üldistunud sotsiaalseks ebavõrdsuseks. |
| 6, RU | Tänane voor ja tähtaeg | Kasulik piiratud vastus; dubleeritud viited | Avaldatud RU vastus. Tänast staatust ei mõelda välja; 23. märts, kohustuslik 9. märtsini algatatav eelnõustamine ja plaanitud sügisene voor on S3/S5-s. Viited puhtad. Allika „käesolev aasta” võiks olla selgemalt allika aja külge seotud. |
| 7, ET | Artikkel kui kõigile valdadele siduv reegel | Avaldatud põhieristus, kuid lisatud allikaga ebapiisavalt toetatud üldnõudeid | **Peatatud.** Kolmas plokk kirjeldab paketis puuduva õigusliku aluse/piiride tõendit, kuid on `factual=true`, `refs=[]`. Mustand ei muuda artiklit siduvaks normiks, kuid seda põhivastust kasutaja ei saanud. Avaldamise regressioon; privaatse mustandi paranemine ei ole avaldatud vastuse paranemine. |
| 8, RU | Teadmata vald, hind ja tähtaeg | Hinda/garantiid ei leiutatud, kuid õppesamm esitati kinnitatud üldise sammuna | Avaldatud RU vastus. Hind ja garanteeritud tähtaeg jäävad õigesti teadmata; küsitakse valda. „Kinnitatud” on asendunud „üldise järgmise sammuga”, kuid H3 õppefaktilehe roll pole selle sammu juures endiselt selgelt nimetatud. Ulatuse puudus on osaliselt alles. |

See on nähtava teksti ja sellele tegelikult antud allikate käsitsi võrdlus olemasolevate mõõtmete järgi. Uut hindamisrubriiki ega automaatset semantilist hindajat ei lisatud. [Privaatne sisuline hinnang](../../tmp/rag-v2-m4-regression-ready/answer-review.json) ning [muutmata pärisvastused ja kaitstud mustandid](../../tmp/rag-v2-m4-regression-ready/real-results.json) sisaldavad täpseid seoseid. Viite-ID olemasolu ei tõenda kõigi ploki väidete täielikku sisulist tuge.

### Mis paranes ja mis ei läbinud

| Mõõde | Algne jooks | Parandatud jooks |
| --- | ---: | ---: |
| Vastamiskatsed | 8 | 8 |
| Uued embedding'u kutsed | 8 | 0, kõik 8 vektorit taaskasutatud |
| Avaldatud vastused | 7/8 | 6/8 |
| Viitekontrollis peatatud | 1/8 | 2/8 |
| Avaldatud EN vastuste õige keel | 0/2 | 2/2 |
| Avaldatud ET / RU õige keel | 2/2 ja 3/3 | 1/1 ja 3/3; kaks ET katset peatati |
| Toore/dubleeritud viitekujuga avaldatud vastused | 5/7 | 0/6 |
| Veapöörded taastuvad refresh'il | 0/1 | 2/2 |
| Originaaliga võrreldav pakett | 7 alles | 7/7 sama sisu ja kanoonilised sidemed |

Mõlema uue peatamise põhjus on täpselt nähtav: `$.blocks[1].refs` neljandal ning `$.blocks[2].refs` seitsmendal katsel, saadud väärtus `[]`, lubatud viited `S1`–`S5`. Need plokid olid märgitud faktiplokkideks, kuigi kirjeldasid sisuliselt antud materjali piiri. Olemasolev faktiploki viitenõue tõrjus väljundid. Kontrolli ei nõrgendatud, vaikimisi viidet ei lisatud ning uut mudelikatset ei tehtud. Mõlema mustand, tegelik pakett, request ID, usage ja valideerimisraport säilisid; kasutajale näidati ainult lokaliseeritud terminalset veateadet.

Refresh taastas kõik 8 küsimust, 6 vastust ja 2 veapööret õiges järjekorras. Viies vastus avas kasutajaliidese kaudu S1 tegeliku allikakoha PDF lk 10–11, versioon `version_cb096c93c7ec37aaa354668421a45e1890de87fb2f84bc176bd478a613d42983`; tekst sisaldas mõlemat juhtumit. Allikavaatelt naasmine taastas sama vestluse. Pärast neid lugemisi olid pöörete payload-räsid ja mõlemad ledgerid muutmata: uusi teenusekatseid **0**. [Brauseri ja taastamise tõend](../../tmp/rag-v2-m4-regression-ready/browser-checks.json).

### Tegelik kasutus, piirid ja järgmine otsus

- Provider'i kasutus: **31 836 sisend- ja 2518 väljundtokenit**, kokku **34 354**. Väljund sisaldab **230 arutlustokenit**, neid ei liideta uuesti. Kõigi kaheksa katse usage on teada, teadmata teenusetulemusi 0.
- Tegeliku usage'i ning kinnitatud konservatiivsete ühikuhindade põhine hinnang: **0,01098060 USD**. See ei ole teenusepakkuja kontrollitud arve. Uus ledger säilitab **0,05175055 USD / 144 743 tokeni** reservi ning **8 answer / 0 embedding / 8 kogukatse** loenduri. 0,16 USD jääk ei anna üheksandat vastamiskatset.
- Algne ledger on muutmata: **8 answer / 8 embedding / 16 kogukatset**, reserv **0,04893608 USD / 133 656 tokenit**. Uue jooksu nime ega kausta kaudu seda ei lähtestatud.
- Vastamisteenuse esimese baidi aeg oli 8 katsel **1,638–3,745 s**, mediaan **2,819 s**. Kuue avaldatud vastuse valideeritud serverimustand valmis **3,046–4,728 s**, mediaan **4,261 s**. Need ei ole UI otsast lõpuni ajad ega sõltumatu kiirusbenchmark.
- Kinnitatud loa lõpp jääb **07.09.2026 08:00 UTC / 11:00 Eesti aja järgi**. Algsete vektorite ja tõendite eluiga ei pikendatud; mõlema jooksu katselaed on täis. Avalik vastamine jäi suletuks.

**Järgmine põhjendatud tööots on tõendipiirangu ja faktiploki väljundilepingu korrastamine ning allika rolli/ulatuse täpsus.** Kahe salvestatud ebaõnnestunud mustandi abil saab teha kohaliku regressiooni: puuduvat tõendit kirjeldav piirang peab mahtuma selleks ette nähtud väljundiossa, säilitades viite- ja õiguskontrolli. Alles on ka kõrvalised piirangud, õppefaktilehe liiga üldine järgmine samm ning eesmärgi toimununa sõnastamine. Selle tulemuse põhjal ei alustata automaatselt uut samade kaheksa küsimuse häälestusringi ega kuulutata M4-d vastu võetuks. Päris jätkuvestlus, kasutaja parandus ja inimeste eristamine jäävad eraldi otsustatavaks katseks. M2/M2.3 kinnitused ja seitse lahtist juhtumit säilivad.


## 06.09.2026 kohalik väljundileping v3 — allikaväide ja tõendusmaterjali piir

**See on uus kohalik teostus, mitte uus pärisjooks.** Eelnev `m4-regression-20260906-1` jääb samaks 6 avaldatud / 2 peatatud vastusega jooksuks. Selle vooru välismudelikutseid, commit'e, push'e ja deploy'sid on **0**. Teise akna pooleliolevad quality-gate'i muudatused ning muud omaniku failid säilitati.

### Muudatus ja versioonipiir

Rakenduskood muutus ainult `lib/rag-v2/pilot/contracts.js`, `presentation.js` ja `config.js` failides. Vastuseleping on **`m4-text-refs-3`**, prompt **`m4-grounded-answer-3`**; küsimuseversioon ja otsinguprofiil ei muutu. Sama andmekuju säilib: `kind`, `blocks`, `limitations`, `clarification`. Iga uue versiooni allikaplokk nõuab `factual=true` ja vähemalt ühte selle pöörde lubatud viidet. Nõue on nii provider'ile antavas skeemis (`enum: [true]`, `refs.minItems: 1`) kui serverivalideerijas. Tundmatu viide, vale roll, tühi või liiga pikk sisu ning toored tekstiviited tõrjutakse edasi.

| Uue versiooni kind | Nõutav sisu |
| --- | --- |
| `grounded` | Vähemalt üks viidatud allikaplokk. Mudeli hinnang, mitte serveri tõendatud täielikkus. |
| `partial` | Vähemalt üks viidatud allikaplokk ning mittetühi piirang või vajalik täpsustusküsimus. |
| `clarification` | Mittetühi täpsustusküsimus; `blocks=[]` on lubatud. |
| `unsupported` | `blocks=[]` ning vähemalt üks mittetühi materjalipiiri selgitus; küsimus võib lisanduda. |

Tühja nähtavat vastust ei lubata. Viideteta allikaväidet ei muudeta automaatselt `factual=false` plokiks ega piiranguks, sellele ei lisata vaikimisi viidet ja seda ei eemaldata ülejäänu avaldamiseks. Renderdaja ühendab endiselt sama kolme väljundiosa; eraldi uut vestlusmudelit või HTTP rada ei lisatud.

Väljade seosed on kirjeldatud skeemi tähenduslikes kirjeldustes ja promptis ning jõustatud serveris. OpenAI Structured Outputs ei toeta juurtaseme `anyOf`-i ega `if/then/else` risttingimusi; seetõttu jääb olemasolev lame andmekuju ning `kind`/sisu kooskõla kontrollitakse serveris. Skeemi toetatud kohalikud tüübi-, loendi- ja tekstipiirangud kontrolliti olemasoleva Ajv-ga. Serveri senised UTF-16 pikkusepiirid säilivad. See ei ole uue skeemi pärismudeliga vastuvõtu tõend. [Ametlik skeemijuhis](https://developers.openai.com/api/docs/guides/structured-outputs).

**Versioonid 1 ja 2 säilitavad oma senise tähenduse.** Versioon 1 kasutab endiselt kitsast ajalooliste lõpuviidete esitusühilduvust; versioon 2 keelab tekstiviited ja lubab oma vana `factual=false` kuju. Nende vanade versioonide kõigi `kind`-harude senine vähemalt ühe ploki nõue jääb ajaloolises kontrollis alles. Uued tühja plokiloendi harud ja kõigi plokkide `factual=true` nõue rakenduvad ainult versioonile 3. Lugemisloa promptiversioonide loend säilitab eraldi versioonid 1, 2 ja 3; uut saatmist vana heakskiiduga ei lubata.

Prompt eristab allika enda väidet (näiteks faktileht ei nimeta hinda) vastaja ebapiisavast tõendist. Piirang käib selles vastuses kasutatud väljavõtete kohta, mitte kogu artikli, andmebaasi või maailma kohta. Lisatud on allika rolli, aja ja täpse adressaadi säilitamine, eesmärgi/toimunud sündmuse eristus, sama ploki sündmusväite sidumine sündmuse allikaga ning õppeprotseduuri selge omistamine õppenäitele. Ükski kaheksa küsimuse nimi, oodatud vastus ega lehekülg ei läinud runtime'i erandiks.

### Pärismustandite muutmata taasesitus ja eraldi oodatud näidised

Enne muutmist loeti mõlema peatunud katse kõik plokid koos tegeliku paketiga. Neljanda mustandi esimene plokk on eetikanõukoja allikapõhine kokkuvõte, teine on liiga absoluutselt sõnastatud materjalipiir ning kolmas segab viidatud sünteesi ja pakkumist, olles vana mudeli väljundis `factual=false`. Seitsmenda mustandi allika žanr ja analüütiline roll on toetatud, kuid laiemat õiguslikku järeldust tuleb kitsendada; kolmas plokk on antud tõendi piirang. Ainult tühja viite parandamine ei kinnitaks kogu ülejäänud teksti õigsust.

Muutmata algmustandid annavad versiooniga 2 endiselt täpselt **`$.blocks[1].refs`** ja **`$.blocks[2].refs`** vea. Ka uue versiooniga jäävad samad toormustandid vigaseks; automaatset parandust ei toimu. Ajalooline seis jääb `answer_rejected`. Seitse v1 ja kuus v2 avaldatud vastust loeti oma algversiooniga; algsete failide baidiräsid säilisid.

Eraldi **käsitsi koostatud** oodatud v3-näidised kasutavad samade kahe paketi tegelikke viiteid:

- küsimuse 4 osavastus kirjeldab S1/S3 toel turvalisuse, õiguste ja proportsionaalsuse seost ning S1–S3 toel töötaja toetamise nõudeid; piirang ütleb, et kasutatud väljavõtted ei anna piisavat alust ministeeriumi põhikäsitluse võrdlemiseks. Puuduvat käsitlust ei mõelda välja;
- küsimuse 7 osavastus kirjeldab S1 toel artikli analüütilist rolli ja S5 toel autori väärtuspõhist käsitlust; piirang ütleb, et need väljavõtted ei võimalda kinnitada soovituste õiguslikku siduvust kõigi Eesti valdade teenuseotsustele.

Need näidised läbivad uue tehnilise lepingu ja kuvavad toetatud osa koos piiranguga. Need **ei ole Luna parandatud algvastused** ega muuda ajaloolisi pöördeid. [Käsitsi märgistatud privaatnäidised](../../tmp/rag-v2-m4-answer-contract-v3/expected-private-fixtures.json) ja [taasesituse audit](../../tmp/rag-v2-m4-answer-contract-v3/replay-results.json) seovad sisendfaili/mustandi räsi, paketi räsi, tegeliku algversiooni, kontrolliversiooni ja tulemuse. Eluiga ega juurdepääsuluba ei pikendatud.

`limitations` ei anna semantilist heakskiitu suvalisele lausele. Näiteks valitud väljavõtete põhjal hinna kinnitamata jätmine on lubatud materjalipiir; „kõik omavalitsused pakuvad teenust tasuta” on tõendamata üldväide. Mõlemad võivad läbida stringi vormikontrolli, kuid teise lükkab tagasi sisuline hinnang. Samuti ei võrdu ebapiisav kommentaaripakett terve artikli sisupuudusega ega puuduv õiguslik tõend väitega, et õiguslikku alust ei eksisteeri. [Kolm eraldi sisulist vastandust](../../tmp/rag-v2-m4-answer-contract-v3/semantic-scope-examples.json) märgivad vormikontrolli ja käsitsi tehtud semantilise otsuse eraldi; ammendavat keeletõefiltrit ei väideta.

### Kohalikud kontrollid ja brauser

**PASS 47 / FAIL 0 / SKIP 0** käivitatud eri testide kohta: 21 tuuma/v3/provider'i/esituse testi, 21 päris kohaliku DB püsistustesti, üks konfiguratsioonitest, kaks ajaloolise taasesituse testi, üks olemasolev kanoonilise viite sihttest ning üks tegeliku kohaliku HTTP raja test. Nõuete tabeli ridu ei loetud testideks. Kontrollid katavad ka versiooni 2 taastamise, viiteta/`factual=false` väite tõrje, tühjad ja vastuolulised kind-harud, õigused, aegumise, kordusvõtme, paketisalvestuse tõrke, muutumatu kulureservi, ET/EN/RU päringukeha ja teksti ning võõra allika/versiooni tõrje.

Tegelikus localhosti tavavestluses, eraldatud `sotsiaal_ai_m4_dev` DB ja fikseeritud testtranspordiga, kontrolliti järjekorda **EN partial → ET clarification → RU unsupported → sünteetiline viiteviga → ET grounded**. Esimene vastus kuvas viidatud põhisisu koos eraldi piiranguga. Täpsustusküsimus ning toeta materjalipiir avaldusid `blocks=[]` kujul, ilma kunstliku tekstiviiteta. Vigane faktiplokk jäi avaldamata; täieliku toe näidis säilitas kasuliku viidatud vastuse.

Refresh ja 390 × 844 mobiili allikavaatelt naasmine taastasid kõik viis pööret õiges järjekorras. Mobiilis olid täpsustusküsimus ja venekeelne piirang terviklikult loetavad; dokumendi laius oli 390 px. Osavastuse S1 avas tegeliku kanoonilise artiklikatkendi PDF lk 2–3. Pärast lugemisi ja sama võtme paralleelseid HTTP korduspäringuid oli endiselt 5 testvastuse ja 5 test-embedding'u sündmust; uusi teenusekatseid lugemisest 0, välismudelikutseid 0, kulu 0 USD. Privaatne vigane mustand ei jõudnud DOM-i ega avalikku HTTP vastusesse. [Brauseri/DB tõend](../../tmp/rag-v2-m4-answer-contract-v3/browser-checks.json), [HTTP tõend](../../tmp/rag-v2-m4-answer-contract-v3/http-checks.json).

Muudetud koodi ja sihttestide eslint **PASS**; `npm run build` koos `i18n:check`-iga **PASS** (23,3 s kompileerimine, exit 0); `git diff --check` **PASS**. Prisma skeemi ega migratsioone ei muudetud. Build kontrollis olemasolevat tööpuud, sealhulgas säilitatud teise akna pooleliolevaid muudatusi; selle vooru muudatused on eristatud failidiffis. Serverisse midagi ei saadetud.

### Järgmise päriskatse ettevalmistatud ulatus

[Ülevaatuseks mõeldud nelja juhtumi ulatus](../../tmp/rag-v2-m4-answer-contract-v3/next-real-scope.json) katab kaks peatunud ET juhtumit, EN täieliku toe kontrolli ja RU puuduliku toe/täpsustuse kontrolli. See ei ole käivitatav plaan: heakskiit, kvoot, kogukulupiir ja uus kehtivusaeg on määramata ning kuuluvad järgmisse eraldi otsusesse. Senised katselaed on täis; vanade vektorite võimalik taaskasutus eeldab jätkuvalt kehtivat luba ja ei pikenda nende eluiga. Uut kaheksa küsimuse häälestusringi ei alustatud; teadaolevad küsimused ja nende järgi häälestatud parafraasid ei ole puutumatu kontroll.

Kohalik tulemus tõendab väljenduse, vormikontrolli, püsistuse ja taastamise rada. **Luna õige rollivalik, uue skeemi tegelik järgimine ja väidete semantiline tugi jäävad päriskatsega kontrollida. M4 ei ole tervikuna vastu võetud.** Otsinguprofiil, korpus, tükeldus, põlvkond, embedding-ruum, mudel, M2/M2.3 kinnitused ning seitse lahtist juhtumit säilivad.

## 06.09.2026 väljundileping v3 — nelja juhtumi päriskontroll

**Üks kinnitatud nelja küsimuse pärisjooks on lõpetatud: kõik 4 vastust avaldati.** Kaks v2-s viitekontrollis peatunud küsimust avaldusid v3-s kasulike osavastustena; EN täieliku toe kontroll jäi avaldatuks ja RU puuduliku toe vastus sisaldas eraldi piirangut ning täpsustusküsimust. Tooreid viitemärke, tundmatuid viiteid, `factual=false` plokke, terminalseid vigu ega teadmata teenusetulemusi ei tekkinud. See sulgeb konkreetse tühja viitega faktiploki avaldamisvea, kuid kolm vastust sisaldavad endiselt sisulist allikarolli või väite ulatuse puudust. M4 tervikuna ei ole vastu võetud.

### Paigaldus, muudatuste eristus ja plaan

V3 kood, sihttestid ja eelmine kohalik raport commit'iti ning paigaldati commit'il **`0a7a5f9a0218872935df471da27615d710248cb7`**. Commit sisaldas täpselt 11 M4 faili: kolm runtime-faili, kuus sihttestifaili ning M4 audit ja S1.0. Teise akna kohalikud `app/layout.js`, `lib/chat/questionRequirements.js` ja `lib/chat/ragDiagnostics.js` quality-gate'i muudatused, muud mustandid ja kasutaja failid jäid commit'ist ning serverist välja. [Täpne paigalduspiir](../../tmp/rag-v2-m4-v3-real/deployment-scope-final.json).

Serveri build läbis (35,9 s kompileerimine), pending migratsioone ei olnud ja frontend mõõdeti aktiivseks. Serveri 75 runtime-faili kontrollsumma vastas täpselt commit'i Git-blobidest arvutatud Linuxi failisisule: **`9ad2eea053844eb341052314394fa9b100c1f21013aeb851ccf83be7c8958c52`**. See kontroll tehti enne ühtegi pärismudeli kutset.

Koondplaan **`m4-answer-contract-v3-real-20260906-1`** fikseeris neli küsimust, `m4-grounded-answer-3`, `m4-text-refs-3`, sama `gpt-5.6-luna` mudeli/projekti, nimetatud katsetaja, kaheksa dokumendi versioonipildi, indeksipõlvkonna ja `vector-ranked-first-v1` profiili. Piirid olid 4 vastamiskatset, 0 embedding-kutset, 264 192 tokeni reserv ja 0,08 USD; täielik konservatiivne rahaline reserv oli 0,0738304 USD. Loa lõpp jäi **07.09.2026 08:00 UTC**. Omaniku „loe ja tegutse” juhis ning lisatud nelja juhtumi töökorraldus seoti selle plaani täpse ulatusega; eelnevate plaanide load ja rahajäägid ei andnud uut kvooti.

Enne aktiveerimist kontrolliti uuesti konto, mudeliprojekt, aktiivne indeks ja neli vektorit: küsimusetekst, räsi, embedding-keha, 3072 mõõdet, vektoriräsi, omanikuõigus, arhiiviseis ja aegumine vastasid. Uusi embedding-kutseid tehti **0**. Kinnitatud plaani räsi on **`060c45ed97b555edde31b7860ed1caa06bf607c2136a4445e5cb79f4e188c0a5`**. [Serveriplaan](../../tmp/rag-v2-m4-v3-real/server-plan.json) ja [aktiveerimistõend](../../tmp/rag-v2-m4-v3-real/activation-result.json).

Kõik neli küsimust esitati tavalise [v3 pärisvestluse](https://sotsiaal.ai/vestlus?conversation=m4-v3-real-20260906-1) kaudu, igaüks üks kord ja `contextMode=new`. Jooksu keskel ei muudetud prompti, skeemi, profiili ega koodi. Paranduskutset, varumudelit, automaatset kordust, viidete vaikset parandust ega hindavat mudelit ei kasutatud.

### Tegelikud vastused ja sisuline ülevaatus

| # | Juhtum | Tehniline tulemus | Allikatoe ja kasulikkuse tulemus |
| --- | --- | --- | --- |
| 1, ET | Eetikanõukoja ja ministeeriumi rõhuasetused | `partial`, avaldatud. Kaks viidatud plokki, piirang ja täpsustusküsimus. | **Läbis väikese sõnastusriskiga.** S1–S3 toetavad õiguste, proportsionaalsete meetmete ja töökorralduse kokkuvõtet; S5 toetab arutelu jätkamist partneritega. Piirang tunnistab, et esitatud materjal ei võimalda ministeeriumi põhikäsitlust võrrelda. Täpsem oleks öelda „selles vastuses kasutatud väljavõtted ei anna piisavat alust”, sest see väldib ka näilist kogu materjali sisukontrolli. |
| 2, ET | Artikli soovitused kui siduv reeglistik | `partial`, avaldatud. Kolm viidatud plokki ja eraldi piirang. | **Osaline.** S1 toetab analüüsi rolli ning S3–S5 väärtusi ja inimliku kaalutluse käsitlust. Piirang on õigesti valitud väljavõtete külge seotud. Lause „ainuüksi artikkel ei muuda … kohustuslikuks normistikuks” on siiski õigusliku ulatuse järeldus, mida artiklikatkendid ilma eraldi õigusallikata täielikult ei tõenda. |
| 3, EN | Olemasolev tehnoloogia ja kohandamine | `grounded`, avaldatud EN vastus, puhtad viited. | **Osaline eesmärgi/sündmuse vea tõttu.** S1 toetab olemasoleva tõendatud tehnoloogia ja kohaliku kohanduse nõuet; S3/S4 kahte etappi. Teine plokk ütleb endiselt, et programm „brought together” osapooled, kuigi viidatud S3 sõnastab selle programmi eesmärgina. Kasulik põhivastus säilis, kuid eesmärk muutus toimunud sündmuseks. |
| 4, RU | Teadmata vald, hind ja garanteeritud tähtaeg | `partial`, avaldatud RU vastus. Kaks S1 plokki, piirang ja täpsustusküsimus. | **Osaline.** Vastus nimetab materjali õppekirjelduseks, ei leiuta hinda, tähtaega ega garantiid ning küsib valda. S1 toetab faktilehe protsessi ja puuduvaid väärtusi. Piirang lisab, et teine õppenäide puudutab teist inimest ja tinglikku elukohta; S2 sisaldab seda infot, kuid see allikaväide on peidetud viiteta piirangusse. Allikarolli täpsus paranes, piiranguväli kannab endiselt kõrvalväidet. |

See on muutmata mudeliväljundi ja iga vastuse tegeliku paketi käsitsi ülevaatus olemasolevate mõõtmete järgi. Uut rubriiki ega automaatset hindajat ei lisatud. [Muutmata väljundid ja paketid](../../tmp/rag-v2-m4-v3-real/real-results.json), [tehniline paarisvõrdlus](../../tmp/rag-v2-m4-v3-real/technical-comparison.json) ning [sisuline hinnang](../../tmp/rag-v2-m4-v3-real/answer-review.json).

Kõigi nelja juhtumi v3 `model_context` ja kanoonilised viitesidemed olid vastava v2 paketiga võrdsed **4/4**; võrdlusest jäeti välja ainult genereeritud query-ID. Dokumendiversioonid, chunk'id, span'id, PDF-lehed ja teksti räsid vastasid. Iga tegelik answer-body salvestati enne kutset ja selle räsi vastas ledgeris reserveeritud kehale. Seetõttu ei tulene nähtavad erinevused muutunud otsingupaketist. Üks nelja küsimuse kordus ei erista siiski prompti mõju Luna juhuslikust varieeruvusest ega anna üldist kvaliteedigarantiid.

### Taastamine, kasutus ja järeldus

Refresh taastas kõik 4 küsimust ja 4 vastust õiges järjekorras. Esimese vastuse S1 avas kasutajaliidese kaudu kanoonilise artiklikatkendi PDF lk 4 ning allikavaatelt naasmine taastas sama vestluse. Nähtavas tekstis polnud tooreid viitemärke. Pärast refresh'i ja allikavaadet olid kõigi pöörete payload-räsid ning kolm ledgerit muutmata; lugemine lisas 0 teenusekatset. [Brauseritõend](../../tmp/rag-v2-m4-v3-real/browser-checks.json).

Provider'i kasutus oli **17 437 sisend- ja 1392 väljundtokenit**, kokku **18 829 tokenit**. Väljund sisaldab 130 arutlustokenit; neid ei liideta uuesti. Konservatiivne tegeliku usage'i hinnang on **0,00602965 USD**, mitte kontrollitud teenusepakkuja arve. Uus ledger säilitab 0,02860340 USD / 83 284 tokeni reservi ning täis **4 answer / 0 embedding / 4 kogukatse** loendurid. Rahaline jääk ei anna viiendat katset. Eelkäija 8/0 ja algse 8/8 ledgeri seisud jäid muutmata.

Vastamisteenuse esimese baidi aeg oli **2,101–4,011 s**, mediaan 2,893 s. Nelja valideeritud mustandi serveriaeg oli **3,462–5,689 s**, mediaan 4,515 s. Need pole brauseriraja otsast lõpuni ajad ega sõltumatu kiirusbenchmark.

**V3 väljundilepingu konkreetne avaldamisviga on DONE:** põhjendatud osavastus ja aus piirang saavad koos avalduda ning viiteta täpsustusküsimus ei vaja kunstlikku plokki. Sisuline allikatugi ei ole DONE: eesmärgi muutmine sündmuseks, eraldi õigusallikata õiguslik järeldus ning piirangusse peidetud allikaväide on alles. Uut nelja küsimuse või kaheksa küsimuse jooksu ei käivitata automaatselt. Järgmine otsus peab eraldi määrama, kas enne piiratud jätkuvestluse arendust tehakse kitsas semantilise allikarolli parandus või viiakse need teadaolevad piirid jätkuvestluse katsesse. Avalik vastamine jääb suletuks; M2/M2.3 kinnitused ja seitse lahtist juhtumit säilivad.
