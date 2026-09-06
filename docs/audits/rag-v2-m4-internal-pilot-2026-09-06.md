# M4 — autentimisega kaitstud kohalik sisepiloot

06.09.2026. **Kohalik testtranspordi rada töötab. M4-B pärismudeli katse on käivitamata.** Avalik chat on endiselt suletud. Ühtegi uut embedding'u ega Luna teenusekutset ei tehtud, M2 eelarvet ei kasutatud, push'i ega deploy'd ei tehtud.

## Teostus ja lähtepuu

Töö toimus põhikausta `main`-harus kohalikul lähte-SHA-l `0873f148b424242f5497f6e60516c32a7a45f526`. Varasemad kohalikud M2.3 failid ja omaniku muud failid säilisid. Kogu tööpuu ei ole commit'itud. M2 kinnitusi ega ajaloolisi hindamistulemusi ei kirjutatud üle.

Uus `/rag-pilot` leht kasutab tegelikku serverisessiooni ja nimelist failipõhist piloodiluba. `/api/chat` suunab ainult piloodi märgisega päringu kaitstud adapterisse. Tavaline GET annab endiselt `generationAvailable=false`; tavalise vastamise paus säilib. Kasutajavaade kuvab testrežiimi, tervikliku kontrollitud vastuse, kasutatud/leitud allikad ja kaitstud allikadialoogi. ET/EN/RU kasutajaliidese tõlked lisati olemasolevatesse kataloogidesse.

`lib/rag-v2/pilot/` sisaldab piiratud päringuehitajat, vastuse- ja viitelepingut, konfiguratsiooni/loa kontrolli, püsistust ja teenusepakkuja adapterit. Next.js-i sessiooni/HTTP detailid on `lib/chat/m4PilotServer.js` failis. Olemasolevat M1 sissevõttu ega M2 otsingualgoritmi ei ehitatud ümber. Lepingu põhjendus: [ADR-006](../rag-v2/adr-006-private-http-pilot.md).

Uus migratsioon lisab `M4PilotTurn` ja sisuta `M4PilotLedger` tabelid. Pööre kasutab olemasolevaid `Conversation`/`ChatTurn` identiteete; üldistes sõnumites on kaitstud piloodi kohatäitjad. Tegelik vastus, küsimus ja allikaseosed avanevad piloodi õiguskontrolli kaudu. Reserveeringuid kaitseb PostgreSQL-i nõuandelukk; kustutamise/salvestamise võistlust vestluserea lukk. Tehingu rollback, idempotentsus ja katkestatud katse seis on kontrollitud päris andmebaasis.

Teostuse failiräside manifest: [privaatne manifest](../../tmp/rag-v2-m4/m4-implementation-manifest.json). Manifesti koondräsi on `0d88b290c65eec1b2e392f52b20b15daa987baded3b503006689d7f68cde5d0c`. Pärisrežiim võrdleb selle räsi kinnitatud plaaniga. See seob kohaliku muutunud puu, mitte ainult vana HEAD-i.

## Käivitatud kontrollid

| Kontroll | Tulemus | Tõendi piir |
| --- | --- | --- |
| M4 tuum, konfiguratsioon ja provider'i protokoll | 9 pass, 0 fail, 0 skip | Asendustransport; puuduvad pärismudelikutse ja kvaliteediväide |
| M4 püsistus ja võistlused eraldatud PostgreSQL-is | 11 pass, 0 fail, 0 skip | Päris tehingud/lukud/rollback, provider'i vastused asendatud |
| Olemasolev M2 otsingu- ja profiiliregressioon | 14 pass, 0 fail, 0 skip | Tokenid, õigused, valikuprofiil, viite/hindaja eraldus; semantilisi vastuvõtte ei korratud |
| Valitud M1 algallika, õiguste ja versioonide kontroll | 3 pass, 0 fail, 0 skip | Tegeliku kohaliku PDF-i algtekstikohad, õigused ja versiooni säilimine |
| Muutunud failide eslint | pass, 0 viga, 0 hoiatust | Koodikuju |
| i18n, Prisma validate, diff check | pass | Kataloog, skeemi kuju ja diff |
| Tootmisbuild | pass | Kompileerumine; mudeliühendust ei tõenda |
| Brauser: sessioon → küsimus → vastus → allikas → refresh | pass testrežiimis | Tegelik HTTP ja kohalik andmebaas, fikseeritud vastaja |
| Päris PostgreSQL/Qdrant, olemasolev ühe dokumendi indeks | pass | Üks päris vektorpäring varem salvestatud pärisvektoriga, 5 kanoonilist viidet |
| Kavandatud kaheksa dokumendi indeksipõlvkond | **NOT_PROVEN** | Kohalik aktiivne indeks on teine; vastavuskontroll peatas raja |
| Luna tegelik ühendus, usage ja vastuse sisu | **not_run** | Mudeli-, konto-, materjali- ja kululuba puudub |

Kokku **37 eri siht-/regressioonitesti läbisid, 0 fail ja 0 skip**. Sama lõpliku koodipuu tootmisbuild'i ei korratud dokumentide lisamise tõttu. Build hoiatas olemasoleva kohaliku e-posti transpordi puudumise kohta; ehitus lõppes exit 0.

Käsud: `node --import ./scripts/register-node-source-loader.mjs --test` koos nelja `tests/rag-v2-pilot-{core,config,provider,store}.test.mjs` failiga ning `tests/rag-v2-search.test.mjs` ja `tests/rag-v2-selection.test.mjs`. M1 kitsas jooks kasutas `--test-name-pattern='I-04|I-10|M1 versioning'` ning `RAG_V2_INPUT_ROOT=Andmebaasi/ajakiri`. Andmebaasikatsetes oli `TZ=UTC` ja eksplitsiitne `M4_TEST_DATABASE_URL` eraldatud arendusbaasile.

## Vastuvõtumaatriks

| ID | Tõend ja tulemus |
| --- | --- |
| M4-01, 20 | Lüliti/config/loa väravad testitud; anonüümne HTTP 401, teine sisselogitud admin 403. Testharu ei kutsu provider'it ka võtme olemasolul. |
| M4-02, 03 | Kliendi `role`, tenant, history, room ja document väljad HTTP 400; võõras vestlus DB kontrollis keelatud. Päringuehitaja ei loe assistendiajalugu. |
| M4-04 | Esimesel päringul embedding+answer; lubatud cache tabamuse teisel päringul ainult answer. Võõras kasutaja ja arhiveeritud vestlus ei anna cache'i. Vale indeks/vektorruum tõrjutakse. |
| M4-05 | Tühi küsimus 400, ülisuur keha 413, vale päritolu 403; kvoot peatab saatmise. Kogu teksti ei kärbita vaikimisi. |
| M4-06 | Brauseris üks fikseeritud testvastus ja täpne algtekstikoht; pärisvastaja sisuline õigsus NOT_PROVEN. |
| M4-07, 08 | Osavastuse, täpsustuse ja puudumise väljundileping on olemas. Väite liigi, välja jäetud tingimuste ja kasulikkuse sisuline vastuvõtt ootab M4-B-d. |
| M4-09 | Sama teema jätk kasutab eelnevat kasutajaküsimust; teema-/inimesevahetus ja parandatud asjaolu ei kanna eelmist teksti üle. Üldist teemaeristust ei väideta. |
| M4-10 | Tundmatu või puuduv viide peatab kogu mustandi. HTTP `S99` 403. Päris resolver kontrollis 5 versiooni/teksti/lehekohaga viidet. |
| M4-11 | Loa tühistamine otsingu ja genereerimise vahel peatas teise etapi; hilisem HTTP taastamine tühistatud loaga andis 403. Sessioon ja faililuba loetakse etapiti uuesti. |
| M4-12 | HTML-küsimus renderdus tekstina: käivitunud lipp false, vastusepiirkonna `img` arv 0. Tööriistu ei saadeta. Semantilise juhisesüsti mõju pärisvastajale not_run. |
| M4-13 | Kaks samaaegset HTTP päringut said sama pöörde-ID; jäljes oli üks embedding ja üks answer. Sama võtme teine sisu 409. |
| M4-14 | Timeout säilitas teadmata oleku ja reserveeringu. **Eraldi uues Node'i protsessis** taastati sama `unknown` ilma saatmiseta. |
| M4-15 | Püsiv ühine piir jäi alles eri teenuseinstantsides/protsessis ja ka vestluse kustutamise järel. Piloodil on korraga üks töö; teadmata aktiivne katse hoiab uut tööd kinni. |
| M4-16 | Refusal, poolik/vigane JSON, teine mudel ja puuduv usage ei anna edukat vastust. Pärast mõlema sõnumi kirjutamist tekitatud tehinguviga rollback'is need; taastamine salvestas sama mustandi uue mudelikutsena saatmata. |
| M4-17 | Kustutamine answer-transpordi ajal takistas hilist salvestust ja vestluse taastamist. Brauseri kustutus 200, järgmine lugemine 403. |
| M4-18 | Täielik tegeliku sisselogimisega brauserirada läbis; refresh ja rakenduse restart säilitasid vastuse. |
| M4-19 | Embedding ja answer on eraldi kuluread; reserveering hõlmab kogu prompti, kasutajaandmeid, tõenduspaketti, skeemi ning väljundi/arutluse lage. Tegelik usage säilib eraldi; tundmatu kasutus ei vabasta reserveeringut. |

## Brauserinäide ja ajad

Keskkond: `http://localhost:3000/rag-pilot`, Windows, Chromium/Playwright MCP. Browser-plugin'i oskust sessioonis ei olnud; kasutati olemasolevat Playwrighti. Andmebaas `sotsiaal_ai_m4_dev` loodi kohalikus PostgreSQL-is skeemi ja migratsiooniajaloo koopiast. **Ühtegi varasemat kasutajarida, vestlust ega juhtumit ei kopeeritud.** Sünteetiline testkasutaja läbis olemasoleva `login-step1` → NextAuth CSRF → credentials → jälgitava sessiooni raja; turvakontrolle ei lülitatud välja. Kohaliku arenduse olemasolev admini sisselogimisreegel säilis muutmata.

Näide: „Millist rolli võib tehisintellekt täita sotsiaaltöötaja toetamisel?” Testvastaja kuvab selgelt märgistatud allikakatkendi; `Ava S1` avab artikli „Tehisintellekt sotsiaaltöös: praktika, kaalutlused ja väärtuspõhised piirid” algteksti **PDF lk 2–3**. Versioon on seotud pöördega, mitte mudeli antud URL-iga. Vastus taastati refresh'i ja dev-protsessi taaskäivituse järel.

Ühes eraldi üldküsimuse ajaproovis oli esimene brauseri olekutekst **4 ms**, esimene avaldatud vastus **427,1 ms**, serveri valideeritud mustand **140 ms** ja eduka HTTP vastuse valmidus **196 ms**. Need on ühe sooja kohaliku **testtranspordi** proovi arvud. Päris provider'i esimese baidi aeg on not_run; adapter mõõdab selle tulevasel lubatud katsel. Testvastaja kasutusarvud on sünteetilised, mitte OpenAI arve. Päringu sisend oli 26 tokenit; kogu answer-keha konservatiivne sisendreserv oli 3905 ning koos väljundilaega 4905 tokenit. Rahaline testikulu oli 0.

Desktop 1365×1000 ja mobiil 390×844 ei andnud horisontaalset ülevoolu; allikadialoog oli loetav ja Escape sulges selle. Esimene visuaalne katse leidis heleda piloodipinna/tumeda üldstiili kontrastivea; lõplik kujundus parandati olemasoleva tumeda paneeli jaoks. ET/EN/RU pealkirjad kontrolliti brauseris. Pärisvastuse keelekvaliteeti see ei tõenda.

Lõplikul reload'il ei olnud piloodi JavaScripti erindit ega framework'i veakihti. Konsool pole täiesti tühi: rakenduse olemasolev globaalne Cloudflare'i analüütika tekitab localhostis CORS-vigu. Arenduse vahelogis olid ka peatatud dev-serveri HMR-ühenduse ja ajutise failiasenduse vead; lõplik build ja reload neid ei korranud. Neid ei varjatud „puhta konsooli” väitega.

Brauseri koond: [browser-checks.json](../../tmp/rag-v2-m4/browser-checks.json). Pildid: [desktop](../../tmp/rag-v2-m4/browser-desktop.png), [allikavaade](../../tmp/rag-v2-m4/browser-source.png), [mobiili allikavaade](../../tmp/rag-v2-m4/browser-mobile-source.png).

## Pärisotsingu integratsiooni piir

M2.3 plaan nimetab kaheksa dokumendi põlvkonda `search_generation_386d51771eff1ece99cc354144ea589736a4c36c18101847dc57d6e3665d4e6e`. Käsk luges kohalikust pärisregistrist aktiivseks `search_generation_a1412c030cf3592f528c5e0e1d6bcae121659793f84e5b89054dbdc4880d54c2`, milles on **üks** varasema identiteediga artikkel. Mõlemad kasutavad `text-embedding-3-large`/3072 ruumi; see ei tee korpuseid samaks.

Kaheksa dokumendi vastavuskontroll peatati enne query/provider-kutset. Eraldi, eksplitsiitselt ühe dokumendi **transpordi ühilduvuskatses** läbis sama uus adapter ühe PostgreSQL/Qdranti päringu, leidis 15 kandidaati, valis 5 viidet ja lahendas kõik kanooniliselt. Kasutati varem kontrollitult salvestatud päris-päringuvektorit; uusi embedding'eid ei arvutatud. Otsing võttis ühes proovis umbes 435 ms, millest registri töö umbes 104 ms. See mõõdab ka praegust korpuse lugemise/valideerimise kulu; suure korpuse skaleerimist ei tõenda. Tulemused: [ühilduvuskatse](../../tmp/rag-v2-m4/search-transport-compatibility.json) ja [kavandatud integratsiooni piir](../../tmp/rag-v2-m4/search-integration.json).

Indeksit ei ehitatud ümber ega vahetatud. Ühe dokumendi rohelist transporti ei esitatud kaheksa dokumendi vastuvõtuna. Vektori teadaolevad piirangud, sh kolleegidega eetika arutelu ning kadunud andmeminimeerimise naabertugi, säilivad. Profiil on uuritav lähtevariant, mitte üldiselt parim meetod.

## M4-B koondplaan ja järgmine värav

Valmis on üks [privaatne m4-pilot-plan.json](../../tmp/rag-v2-m4/m4-pilot-plan.json), [materjalimanifest](../../tmp/rag-v2-m4/m4-material-manifest.json) ja [hindamisleht](../../tmp/rag-v2-m4/m4-answer-evaluation.json). Kaheksa seni käivitamata küsimust on jaotatud 4 arendus- ja 4 kontrollperekonnaks, ET/EN/RU jaotus 3/2/3. Kuus varasemat avamata ettepanekut taaskasutati ja lisati kaks uut piiriküsimust. Seitsme lahtise M2 juhtumi seisu ei muudeta. Küsimusi, nõudeid ega välju `full/partial/absent` ei loeta runtime'i otsingusse.

Plaan pakub täpset `gpt-5.6-luna` Responses API lepingut, `reasoning=low`, `store=false`, 2048 väljundtokeni lage ja 30 s timeout'i. Kogu küsimuse/answer'i ühine katsete lagi on 16 ja reserveeritud tokenite lagi 544384; kavandatud on kaheksa uncached küsimus/vastus-paari. Cache tabamus võib embedding'u ära jätta, kuid ei lähtesta kogupiire ega õigusta piiramatut lisakatsetamist. **Rahaline kogulagi on nullväärtusena täitmata, mitte 0-dollariline luba.** Vaba interaktiivne katsetamine pole selles lukustatud küsimuste plaanis lubatud.

Kohalikus `.env`/`rag.env` seadistuses puuduvad mõõdetult `OPENAI_MODEL`, API-võti ja projekt. `lib/chat/settings.js` fallback ei ole konto ligipääsu tõend. Vajalik on kinnitada tegelik `gpt-5.6-luna` mudel, serverisse seadistatud projekt/võti, nimelised päriskatsetajad, loa tähtaeg ja rahaline kogupiir ning **nii küsimuseteksti embedding'uks kui ka valitud allikakatkendite vastajale saatmise luba**. Lisaks tuleb valida vastava kaheksa dokumendi indeksiga katsekeskkond või taastada see eraldi kokkulepitud viisil. Konto tegelik mudeliligipääs ja vastuste sisuline kvaliteet selguvad alles lubatud M4-B katses.

Avaliku standardhinna ettepanek põhineb ametlikel [Luna mudeliandmetel](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [embedding'u mudeliandmetel](https://developers.openai.com/api/docs/models/text-embedding-3-large) ja [cache'i hinnastamisel](https://developers.openai.com/api/docs/guides/prompt-caching). Answer'i sisendreserv arvestab konservatiivselt 1,25× cache-write määra. See pole kontoarve ega omaniku kululuba.

Oma serveri toorsisu/cache ettepanek on 48 h, hilisem lugemine on tähtaja järel keelatud. Füüsiline kustutus kasutab olemasolevat retention-tööd; seisva rakenduse puhastus ei toimu iseenesest. Käesoleva privaatse brauseri-/aruandekoopia käsitsi puhastamise tähtaeg on **13.09.2026**. Eraldatud baasi WAL-i ja olemasolevaid hostivarukoopiaid ei nimetata kustutatuks; uut varukoopiat ei loodud. Teenusepakkuja logi/cache'i tingimused on plaanis [ametliku andmekontrollide lehe](https://developers.openai.com/api/docs/guides/your-data) järgi; ZDR-i, MAM-i või piirkondlikku töötlust pole konto kohta tõendatud.

Kohalik `npm run dev` töötab selle kontrolli lõpus eraldatud testbaasi ja ainult protsessi keskkonnas aktiveeritud testkonfiguratsiooniga. Uus tavaline käivitus ilma `M4_PILOT_ENABLED`/`M4_PILOT_CONFIG` seadeteta jätab piloodi suletuks. Testkasutaja autentimine ja andmebaas on arenduse tõend, mitte pärispiloodi kasutajate luba.
