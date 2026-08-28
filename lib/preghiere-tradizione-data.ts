export interface PreghieraTradizionale {
  id: string;
  title: string;
  latinTitle?: string;
  category: "Fondamentali" | "Mariane" | "Spirito Santo" | "Eucaristiche" | "Cantici" | "Devozioni" | "Atti";
  icon: string;
  description: string;
  textItalian: string;
  textLatin?: string;
  origin?: string;
  tags: string[];
}

export const PREGHIERE_TRADIZIONE: PreghieraTradizionale[] = [
  {
    id: "padre-nostro",
    title: "Padre Nostro",
    latinTitle: "Pater Noster",
    category: "Fondamentali",
    icon: "✝️",
    description: "La preghiera insegnata direttamente da Gesù Cristo ai discepoli (Mt 6,9-13; Lc 11,2-4).",
    textItalian: `Padre nostro che sei nei cieli,
sia santificato il tuo nome,
venga il tuo regno,
sia fatta la tua volontà,
come in cielo così in terra.

Dacci oggi il nostro pane quotidiano,
e rimetti a noi i nostri debiti
come anche noi li rimettiamo ai nostri debitori,
e non abbandonarci alla tentazione,
ma liberaci dal male.

Amen.`,
    textLatin: `Pater noster, qui es in caelis,
sanctificetur nomen tuum.
Adveniat regnum tuum.
Fiat voluntas tua,
sicut in caelo et in terra.

Panem nostrum cotidianum da nobis hodie,
et dimitte nobis debita nostra,
sicut et nos dimittimus debitoribus nostris.
Et ne nos inducas in tentationem,
sed libera nos a malo.

Amen.`,
    origin: "Vangeli di Matteo (6,9-13) e Luca (11,2-4)",
    tags: ["padre nostro", "pater", "gesù", "vangelo", "fondamentale"],
  },
  {
    id: "ave-maria",
    title: "Ave Maria",
    latinTitle: "Ave Maria",
    category: "Mariane",
    icon: "🌹",
    description: "Il saluto dell'Arcangelo Gabriele e di Elisabetta alla Vergine Madre (Lc 1,28.42).",
    textItalian: `Ave, o Maria, piena di grazia,
il Signore è con te.
Tu sei benedetta fra le donne
e benedetto è il frutto del tuo seno, Gesù.

Santa Maria, Madre di Dio,
prega per noi peccatori,
adesso e nell'ora della nostra morte.

Amen.`,
    textLatin: `Ave Maria, gratia plena,
Dominus tecum.
Benedicta tu in mulieribus,
et benedictus fructus ventris tui, Iesus.

Sancta Maria, Mater Dei,
ora pro nobis peccatoribus,
nunc et in hora mortis nostrae.

Amen.`,
    origin: "Vangelo di Luca (1,28; 1,42) e Tradizione ecclesiale",
    tags: ["ave maria", "madonna", "rosario", "gabriele", "vergine"],
  },
  {
    id: "gloria-al-padre",
    title: "Gloria al Padre",
    latinTitle: "Gloria Patri",
    category: "Fondamentali",
    icon: "🌟",
    description: "La dossologia trinitaria fondamentale della preghiera cristiana e dei Salmi.",
    textItalian: `Gloria al Padre
e al Figlio
e allo Spirito Santo.

Come era nel principio,
ora e sempre,
nei secoli dei secoli.

Amen.`,
    textLatin: `Gloria Patri,
et Filio,
et Spiritui Sancto.

Sicut erat in principio,
et nunc, et semper,
et in saecula saeculorum.

Amen.`,
    origin: "Dossologia trinitaria dei primi secoli cristiani",
    tags: ["gloria", "trinità", "padre", "figlio", "spirito santo"],
  },
  {
    id: "angelo-di-dio",
    title: "Angelo di Dio",
    latinTitle: "Angele Dei",
    category: "Devozioni",
    icon: "👼",
    description: "La tradizionale preghiera di invocazione e affidamento al proprio Angelo Custode.",
    textItalian: `Angelo di Dio,
che sei il mio custode,
illumina, custodisci,
reggi e governa me,
che ti fui affidato dalla pietà celeste.

Amen.`,
    textLatin: `Angele Dei,
qui custos es mei,
me, tibi commissum pietate superna,
illumina, custodi,
rege et guberna.

Amen.`,
    origin: "Tradizione medievale (XI-XII secolo)",
    tags: ["angelo", "custode", "protezione", "angele dei"],
  },
  {
    id: "eterno-riposo",
    title: "L'Eterno Riposo",
    latinTitle: "Requiem Aeternam",
    category: "Devozioni",
    icon: "🕯️",
    description: "La preghiera di suffragio per tutti i fedeli defunti.",
    textItalian: `L'eterno riposo dona loro, o Signore,
e splenda ad essi la luce perpetua.
Riposino in pace.

Amen.`,
    textLatin: `Requiem aeternam dona eis, Domine,
et lux perpetua luceat eis.
Requiescant in pace.

Amen.`,
    origin: "Liturgia esequiale latina del IV secolo",
    tags: ["eterno riposo", "requiem", "defunti", "pace"],
  },
  {
    id: "credo-apostolico",
    title: "Credo (Simbolo degli Apostoli)",
    latinTitle: "Symbolum Apostolorum",
    category: "Fondamentali",
    icon: "📜",
    description: "L'antico simbolo battesimale della Chiesa di Roma, compendio fedele della fede degli Apostoli.",
    textItalian: `Io credo in Dio, Padre onnipotente,
creatore del cielo e della terra;
e in Gesù Cristo, suo unico Figlio, nostro Signore,
il quale fu concepito di Spirito Santo,
nacque da Maria Vergine,
patì sotto Ponzio Pilato,
fu crocifisso, morì e fu sepolto;
discese agli inferi;
il terzo giorno risuscitò da morte;
salì al cielo,
siede alla destra di Dio Padre onnipotente;
di là verrà a giudicare i vivi e i morti.

Credo nello Spirito Santo,
la santa Chiesa cattolica,
la comunione dei santi,
la remissione dei peccati,
la risurrezione della carne,
la vita eterna.

Amen.`,
    textLatin: `Credo in Deum Patrem omnipotentem,
Creatorem caeli et terrae.
Et in Iesum Christum, Filium eius unicum, Dominum nostrum:
qui conceptus est de Spiritu Sancto,
natus ex Maria Virgine,
passus sub Pontio Pilato,
crucifixus, mortuus, et sepultus,
descendit ad inferos,
tertia die resurrexit a mortuis,
ascendit ad caelos,
sedet ad dexteram Dei Patris omnipotentis,
inde venturus est iudicare vivos et mortuos.

Credo in Spiritum Sanctum,
sanctam Ecclesiam catholicam,
sanctorum communionem,
remissionem peccatorum,
carnis resurrectionem,
vitam aeternam.

Amen.`,
    origin: "Simbolo battesimale romano dei primi secoli",
    tags: ["credo", "simbolo", "fede", "apostoli", "trinità"],
  },
  {
    id: "salve-regina",
    title: "Salve Regina",
    latinTitle: "Salve Regina",
    category: "Mariane",
    icon: "👑",
    description: "Una delle quattro antifone mariane maggiori, attribuita al beato Ermanno Contratto (XI sec.).",
    textItalian: `Salve, Regina, Madre di misericordia,
vita, dolcezza e speranza nostra, salve.
A te ricorriamo, esuli figli di Eva;
a te sospiriamo, gementi e piangenti
in questa valle di lacrime.

Orsù dunque, avvocata nostra,
rivolgi a noi gli occhi tuoi misericordiosi.
E mostraci, dopo questo esilio, Gesù,
il frutto benedetto del tuo seno.
O clemente, o pia, o dolce Vergine Maria.`,
    textLatin: `Salve, Regina, Mater misericordiae,
vita, dulcedo, et spes nostra, salve.
Ad te clamamus, exsules filii Evae.
Ad te suspiramus, gementes et flentes
in hac lacrimarum valle.

Eia ergo, advocata nostra,
illos tuos misericordes oculos ad nos converte.
Et Iesum, benedictum fructum ventris tui,
nobis post hoc exsilium ostende.
O clemens, o pia, o dulcis Virgo Maria.`,
    origin: "Ermanno di Reichenau (XI secolo)",
    tags: ["salve regina", "madonna", "compieta", "avvocata", "misericordia"],
  },
  {
    id: "angelus",
    title: "Angelus Domini",
    latinTitle: "Angelus Domini",
    category: "Mariane",
    icon: "🔔",
    description: "La preghiera dell'Incarnazione recitata tre volte al giorno (mattino, mezzogiorno, sera).",
    textItalian: `V. L'Angelo del Signore portò l'annuncio a Maria.
R. Ed ella concepì per opera dello Spirito Santo.
Ave Maria...

V. «Ecco l'ancella del Signore».
R. «Si compia in me secondo la tua parola».
Ave Maria...

V. E il Verbo si è fatto carne.
R. E ha posto la sua dimora in mezzo a noi.
Ave Maria...

V. Prega per noi, santa Madre di Dio.
R. Perché siamo resi degni delle promesse di Cristo.

Preghiamo:
Infondi nel nostro spirito la tua grazia, o Padre, tu che all'annuncio dell'Angelo ci hai rivelato l'incarnazione del tuo Figlio; per la sua passione e la sua croce guidaci alla gloria della risurrezione. Per Cristo nostro Signore.
Amen.

Gloria al Padre... (tre volte)`,
    textLatin: `V. Angelus Domini nuntiavit Mariae.
R. Et concepit de Spiritu Sancto.
Ave Maria...

V. «Ecce ancilla Domini».
R. «Fiat mihi secundum verbum tuum».
Ave Maria...

V. Et Verbum caro factum est.
R. Et habitavit in nobis.
Ave Maria...

V. Ora pro nobis, Sancta Dei Genetrix.
R. Ut digni efficiamur promissionibus Christi.

Oremus:
Gratiam tuam, quaesumus, Domine, mentibus nostris infunde: ut qui, Angelo nuntiante, Christi Filii tui incarnationem cognovimus, per passionem eius et crucem, ad resurrectionis gloriam perducamur. Per eundem Christum Dominum nostrum.
Amen.`,
    origin: "Tradizione francescana e pontificia (XIII-XIV secolo)",
    tags: ["angelus", "mezzogiorno", "incarnazione", "gabriele", "campane"],
  },
  {
    id: "regina-caeli",
    title: "Regina Caeli",
    latinTitle: "Regina Caeli",
    category: "Mariane",
    icon: "☀️",
    description: "L'antifona pasquale che sostituisce l'Angelus dal giorno di Pasqua fino a Pentecoste.",
    textItalian: `Regina dei cieli, rallegrati, alleluia:
Cristo, che hai meritato di portare nel seno, alleluia,
è risorto, come aveva promesso, alleluia.
Prega il Signore per noi, alleluia.

V. Rallègrati ed esulta, Vergine Maria, alleluia.
R. Perché il Signore è veramente risorto, alleluia.

Preghiamo:
O Dio, che nella gloriosa risurrezione del tuo Figlio hai ridato la gioia al mondo intero, per l'intercessione di Maria Vergine concedi a noi di godere la gioia della vita senza fine. Per Cristo nostro Signore.
Amen.`,
    textLatin: `Regina caeli, laetare, alleluia:
quia quem meruisti portare, alleluia,
resurrexit, sicut dixit, alleluia.
Ora pro nobis Deum, alleluia.

V. Gaude et laetare, Virgo Maria, alleluia.
R. Quia surrexit Dominus vere, alleluia.

Oremus:
Deus, qui per resurrectionem Filii tui, Domini nostri Iesu Christi, mundum laetificare dignatus es: praesta, quaesumus, ut per eius Genetricem Virginem Mariam, perpetuae capiamus gaudia vitae. Per eundem Christum Dominum nostrum.
Amen.`,
    origin: "Antica antifona pasquale (XII secolo)",
    tags: ["regina caeli", "pasqua", "risurrezione", "alleluia", "madonna"],
  },
  {
    id: "magnificat",
    title: "Magnificat (Cantico della Beata Vergine Maria)",
    latinTitle: "Magnificat",
    category: "Cantici",
    icon: "📖",
    description: "Il sublime cantico di lode proclamato da Maria nella Visitazione ad Elisabetta (Lc 1,46-55).",
    textItalian: `L'anima mia magnifica il Signore
e il mio spirito esulta in Dio, mio salvatore,
perché ha guardato l'umiltà della sua serva.
D'ora in poi tutte le generazioni mi chiameranno beata.

Grandi cose ha fatto in me l'Onnipotente
e Santo è il suo nome:
di generazione in generazione la sua misericordia
si stende su quelli che lo temono.

Ha spiegato la potenza del suo braccio,
ha disperso i superbi nei pensieri del loro cuore;
ha rovesciato i potenti dai troni,
ha esaltato gli umili;
ha ricolmato di beni gli affamati,
ha rimandato i ricchi a mani vuote.

Ha soccorso Israele, suo servo,
ricordandosi della sua misericordia,
come aveva promesso ai nostri padri,
ad Abramo e alla sua discendenza, per sempre.

Gloria al Padre e al Figlio e allo Spirito Santo.
Come era nel principio, e ora e sempre, nei secoli dei secoli. Amen.`,
    textLatin: `Magnificat anima mea Dominum,
et exsultavit spiritus meus in Deo salvatore meo,
quia respexit humilitatem ancillae suae.
Ecce enim ex hoc beatam me dicent omnes generationes,

quia fecit mihi magna, qui potens est,
et sanctum nomen eius,
et misericordia eius in progenies et progenies
timentibus eum.

Fecit potentiam in brachio suo,
dispersit superbos mente cordis sui;
deposuit potentes de sede
et exaltavit humiles;
esurientes implevit bonis
et divites dimisit inanes.

Suscepit Israel puerum suum,
recordatus misericordiae,
sicut locutus est ad patres nostros,
Abraham et semini eius in saecula.

Gloria Patri, et Filio, et Spiritui Sancto.
Sicut erat in principio, et nunc, et semper, et in saecula saeculorum. Amen.`,
    origin: "Vangelo di Luca (1,46-55) - Cantico evangelico dei Vespri",
    tags: ["magnificat", "vespri", "maria", "cantico", "visitazione"],
  },
  {
    id: "benedictus",
    title: "Benedictus (Cantico di Zaccaria)",
    latinTitle: "Benedictus",
    category: "Cantici",
    icon: "🌅",
    description: "Il cantico del mattino intonato dal sacerdote Zaccaria alla nascita di Giovanni Battista (Lc 1,68-79).",
    textItalian: `Benedetto il Signore Dio d'Israele,
perché ha visitato e redento il suo popolo,
e ha suscitato per noi una salvezza potente
nella casa di Davide, suo servo,
come aveva promesso per bocca dei suoi santi profeti d'un tempo:
salvezza dai nostri nemici,
e dalle mani di quanti ci odiano.

Così egli ha concesso misericordia ai nostri padri
e si è ricordato della sua santa alleanza,
del giuramento fatto ad Abramo, nostro padre,
di concederci, liberati dalle mani dei nemici,
di servirlo senza timore, in santità e giustizia
al suo cospetto, per tutti i nostri giorni.

E tu, bambino, sarai chiamato profeta dell'Altissimo
perché andrai innanzi al Signore a preparargli le strade,
per dare al suo popolo la conoscenza della salvezza
nella remissione dei suoi peccati,
grazie alla tenerezza e misericordia del nostro Dio,
per cui ci visiterà un sole che sorge dall'alto,
per risplendere su quelli che stanno nelle tenebre
e nell'ombra di morte,
e dirigere i nostri passi sulla via della pace.

Gloria al Padre e al Figlio e allo Spirito Santo...`,
    textLatin: `Benedictus Dominus Deus Israel,
quia visitavit et fecit redemptionem plebis suae,
et erexit cornu salutis nobis
in domo David pueri sui,
sicut locutus est per os sanctorum,
qui a saeculo sunt, prophetarum eius:
salutem ex inimicis nostris
et de manu omnium, qui oderunt nos;

ad faciendam misericordiam cum patribus nostris
et memorari testamenti sui sancti,
iusiurandum, quod iuravit ad Abraham patrem nostrum,
daturum se nobis,
ut sine timore, de manu inimicorum liberati,
serviamus illi in sanctitate et iustitia coram ipso
omnibus diebus nostris.

Et tu, puer, propheta Altissimi vocaberis:
praeibis enim ante faciem Domini parare vias eius,
ad dandam scientiam salutis plebi eius
in remissionem peccatorum eorum,
per viscera misericordiae Dei nostri,
in quibus visitabit nos oriens ex alto,
illuminare his, qui in tenebris et in umbra mortis sedent,
ad dirigendos pedes nostros in viam pacis.

Gloria Patri, et Filio, et Spiritui Sancto...`,
    origin: "Vangelo di Luca (1,68-79) - Cantico evangelico delle Lodi Mattutine",
    tags: ["benedictus", "lodi", "zaccaria", "cantico", "mattino"],
  },
  {
    id: "miserere",
    title: "Miserere (Salmo 50)",
    latinTitle: "Miserere mei, Deus",
    category: "Cantici",
    icon: "💔",
    description: "Il grande salmo penitenziale di Davide, vertice della supplica e della richiesta di perdono a Dio.",
    textItalian: `Pietà di me, o Dio, nel tuo amore;
nella tua grande misericordia cancella la mia iniquità.
Lavami tutto dalla mia colpa,
dal mio peccato rendimi puro.

Riconosco la mia iniquità,
il mio peccato mi sta sempre dinanzi.
Contro di te, contro te solo ho peccato,
quello che è male ai tuoi occhi, io l'ho fatto.

Crea in me, o Dio, un cuore puro,
rinnova in me uno spirito saldo.
Non scacciarmi dalla tua presenza
e non privarmi del tuo santo spirito.

Rendimi la gioia della tua salvezza,
sostienimi con uno spirito generoso.
Signore, apri le mie labbra
e la mia bocca proclami la tua lode.`,
    textLatin: `Miserere mei, Deus,
secundum magnam misericordiam tuam;
et secundum multitudinem miserationum tuarum,
dele iniquitatem meam.
Amplius lava me ab iniquitate mea,
et a peccato meo munda me.

Quoniam iniquitatem meam ego cognosco,
et peccatum meum contra me est semper.
Tibi, tibi soli peccavi,
et malum coram te feci.

Cor mundum crea in me, Deus,
et spiritum firmum innova in visceribus meis.
Ne proicias me a facie tua,
et spiritum sanctum tuum ne auferas a me.

Redde mihi laetitiam salutaris tui,
et spiritu principali confirma me.
Domine, labia mea aperies,
et os meum annuntiabit laudem tuam.`,
    origin: "Salmo 50 (51) della Sacra Bibbia",
    tags: ["miserere", "salmo 50", "perdono", "penitenza", "quaresima"],
  },
  {
    id: "te-deum",
    title: "Te Deum laudamus",
    latinTitle: "Te Deum",
    category: "Cantici",
    icon: "🎺",
    description: "Il solenne inno di ringraziamento della Chiesa, attribuito a Sant'Ambrogio e Sant'Agostino.",
    textItalian: `Noi ti lodiamo, o Dio,
ti proclamiamo Signore.
O eterno Padre,
tutta la terra ti adora.

A te cantano gli Angeli
e tutte le potenze dei cieli:
Santo, Santo, Santo
il Signore Dio dell'universo.
I cieli e la terra
sono pieni della tua gloria.

Tu, Re della gloria, Cristo,
tu sei l'eterno Figlio del Padre.
Tu hai vinto l'angoscia della morte,
hai aperto ai credenti il regno dei cieli.

Salva il tuo popolo, Signore,
guida e proteggi i tuoi figli.
Ogni giorno ti benediciamo,
lodiamo il tuo nome per sempre.
In te abbiamo sperato: non saremo confusi in eterno.`,
    textLatin: `Te Deum laudamus: te Dominum confitemur.
Te aeternum Patrem omnis terra veneratur.
Tibi omnes Angeli, tibi caeli et universae potestates:
tibi Cherubim et Seraphim incessabili voce proclamant:
Sanctus, Sanctus, Sanctus Dominus Deus Sabaoth.
Pleni sunt caeli et terra maiestatis gloriae tuae.

Tu Rex gloriae, Christe.
Tu Patris sempiternus es Filius.
Tu, devicto mortis aculeo,
aperuisti credentibus regna caelorum.

Salvum fac populum tuum, Domine, et benedic hereditati tuae.
Et rege eos, et extolle illos usque in aeternum.
Per singulos dies benedicimus te;
et laudamus nomen tuum in saeculum, et in saeculum saeculi.
In te, Domine, speravi: non confundar in aeternum.`,
    origin: "Sant'Ambrogio di Milano e Sant'Agostino (IV secolo)",
    tags: ["te deum", "ringraziamento", "ambrogio", "fine anno", "solennità"],
  },
  {
    id: "vieni-santo-spirito",
    title: "Vieni Santo Spirito (Sequenza di Pentecoste)",
    latinTitle: "Veni Sancte Spiritus",
    category: "Spirito Santo",
    icon: "🕊️",
    description: "La 'Sequenza d'oro' di Pentecoste, capolavoro lirico e spirituale attribuito all'arcivescovo Stephen Langton.",
    textItalian: `Vieni, Santo Spirito,
manda a noi dal cielo
un raggio della tua luce.

Vieni, padre dei poveri,
vieni, datore dei doni,
vieni, luce dei cuori.

Consolatore perfetto,
ospite dolce dell'anima,
dolcissimo sollievo.

Nella fatica, riposo,
nella calura, riparo,
nel pianto, conforto.

O luce beatissima,
invadi nell'intimo
il cuore dei tuoi fedeli.

Senza la tua forza,
nulla è nell'uomo,
nulla senza colpa.

Lava ciò che è sórdido,
bagna ciò che è árido,
sana ciò che sanguina.

Piega ciò che è rigido,
scalda ciò che è gelido,
drizza ciò ch'è sviato.

Dona ai tuoi fedeli
che solo in te confidano
i tuoi santi doni.

Dona virtù e premio,
dona morte santa,
dona gioia eterna. Amen.`,
    textLatin: `Veni, Sancte Spiritus,
et emitte caelitus
lucis tuae radium.

Veni, pater pauperum,
veni, dator munerum,
veni, lumen cordium.

Consolator optime,
dulcis hospes animae,
dulce refrigerium.

In labore requies,
in aestu temperies,
in fletu solacium.

O lux beatissima,
reple cordis intima
tuorum fidelium.

Sine tuo numine,
nihil est in homine,
nihil est innoxium.

Lava quod est sordidum,
riga quod est aridum,
sana quod est saucium.

Flecte quod est rigidum,
fove quod est frigidum,
rege quod est devium.

Da tuis fidelibus,
in te confidentibus,
sacrum septenarium.

Da virtutis meritum,
da salutis exitum,
da perenne gaudium. Amen.`,
    origin: "Stephen Langton / Papa Innocenzo III (XIII secolo)",
    tags: ["spirito santo", "pentecoste", "veni sancte spiritus", "sequenza"],
  },
  {
    id: "vieni-spirito-creatore",
    title: "Vieni Spirito Creatore (Veni Creator Spiritus)",
    latinTitle: "Veni Creator Spiritus",
    category: "Spirito Santo",
    icon: "🔥",
    description: "Il celebre inno attribuito a Rabano Mauro (IX sec.), cantato nei conclavi, ordinazioni e inizio anno.",
    textItalian: `Vieni, o Spirito Creatore,
visita le nostre menti,
riempi della tua grazia
i cuori che hai creato.

Tu sei chiamato Consolatore,
dono dell'Altissimo Dio,
sorgente viva, fuoco, amore,
unzione spirituale.

Tu sei la forza della mano di Dio,
il dito della sua destra,
la promessa del Padre,
che metti sulle nostre labbra la sua parola.

Sii luce all'intelletto,
fiamma nel cuore;
sana le nostre ferite
con il balsamo del tuo amore.

Difendici dal nemico,
donaci presto la pace:
sotto la tua guida
eviteremo ogni male.

Fa' che per mezzo tuo conosciamo il Padre
e impariamo a conoscere il Figlio;
fa' che crediamo sempre in te,
Spirito del Padre e del Figlio. Amen.`,
    textLatin: `Veni, creator Spiritus,
mentes tuorum visita,
imple superna gratia,
quae tu creasti pectora.

Qui diceris Paraclitus,
donum Dei altissimi,
fons vivus, ignis, caritas,
et spiritalis unctio.

Tu septiformis munere,
dextrae Dei tu digitus,
tu rite promissum Patris,
sermone ditans guttura.

Accende lumen sensibus,
infunde amorem cordibus,
infirma nostri corporis
virtute firmans perpeti.

Hostem repellas longius,
pacemque dones protinus;
ductore sic te praevio
vitemus omne noxium.

Per te sciamus da Patrem
noscamus atque Filium,
teque utriusque Spiritum
credamus omni tempore. Amen.`,
    origin: "Rabano Mauro (IX secolo)",
    tags: ["veni creator", "spirito santo", "rabano mauro", "ordinazioni", "conclave"],
  },
  {
    id: "pange-lingua",
    title: "Pange Lingua & Tantum Ergo",
    latinTitle: "Pange lingua gloriosi",
    category: "Eucaristiche",
    icon: "🍞",
    description: "L'inno composto da San Tommaso d'Aquino nel 1264 per la Solennità del Corpus Domini.",
    textItalian: `Canta, o lingua, il mistero
del glorioso Corpo
e del Sangue prezioso,
che il Re delle nazioni,
frutto di un grembo generoso,
ha sparso per il riscatto del mondo.

Dato a noi da una Vergine purissima,
dopo aver vissuto nel mondo
e sparso il seme della Parola divina,
concluse la sua dimora terrena
con un rito mirabile.

(Tantum Ergo):
Adoriamo dunque prostrati
un Sacramento così grande;
l'antica legge
ceda al nuovo rito:
la fede supplisca
al difetto dei sensi.

Al Padre e al Figlio
sia lode e giubilo,
salute, onore,
potenza e benedizione:
e pari lode sia allo Spirito Santo
che procede da entrambi. Amen.`,
    textLatin: `Pange, lingua, gloriosi
Corporis mysterium,
Sanguinisque pretiosi,
quem in mundi pretium
fructus ventris generosi
Rex effudit gentium.

Nobis datus, nobis natus
ex intacta Virgine,
et in mundo conversatus,
sparso verbi semine,
sui moras incolatus
miro clausit ordine.

Tantum ergo Sacramentum
veneremur cernui:
et antiquum documentum
novo cedat ritui:
praestet fides supplementum
sensuum defectui.

Genitori, Genitoque
laus et iubilatio,
salus, honor, virtus quoque
sit et benedictio:
Procedenti ab utroque
compar sit laudatio. Amen.`,
    origin: "San Tommaso d'Aquino (1264) per la festa del Corpus Domini",
    tags: ["pange lingua", "tantum ergo", "eucaristia", "adorazione", "tommaso d'aquino"],
  },
  {
    id: "stabat-mater",
    title: "Stabat Mater (La Madre Addolorata)",
    latinTitle: "Stabat Mater dolorosa",
    category: "Mariane",
    icon: "✝️",
    description: "La commovente meditazione sulla Vergine Addolorata ai piedi della Croce di Gesù, attribuita a Jacopone da Todi.",
    textItalian: `Stava la Madre addolorata
in lacrime presso la Croce,
mentre pendeva il Figlio.

E il suo animo gemente,
contristato e dolente,
era trafitto da una spada.

O quanto triste e afflitta
fu la benedetta
Madre dell'Unigenito!

Santa Madre, deh, fa' questo:
imprimi le piaghe del tuo Figlio
fortemente nel mio cuore.

Fa' che io porti la morte di Cristo,
fa' che condivida la sua passione,
e rinnovi le sue piaghe.

Quando il corpo morirà,
fa' che all'anima sia donata
la gloria del Paradiso. Amen.`,
    textLatin: `Stabat Mater dolorosa
iuxta crucem lacrimosa,
dum pendebat Filius.

Cuius animam gementem,
contristatam et dolentem,
pertransivit gladius.

O quam tristis et afflicta
fuit illa benedicta
Mater Unigeniti!

Sancta Mater, istud agas,
Crucifixi fige plagas
cordi meo valide.

Fac ut portem Christi mortem,
passionis fac consortem,
et plagas recolere.

Quando corpus morietur,
fac, ut animae donetur
paradisi gloria. Amen.`,
    origin: "Jacopone da Todi / Tradizione francescana (XIII secolo)",
    tags: ["stabat mater", "addolorata", "croce", "venerdì santo", "quaresima"],
  },
  {
    id: "anima-christi",
    title: "Anima di Cristo (Anima Christi)",
    latinTitle: "Anima Christi",
    category: "Eucaristiche",
    icon: "🍷",
    description: "Preghiera medievale di ringraziamento dopo la Comunione, cara alla spiritualità di Sant'Ignazio di Loyola.",
    textItalian: `Anima di Cristo, santificami.
Corpo di Cristo, salvami.
Sangue di Cristo, inebriami.
Acqua del costato di Cristo, lavami.
Passione di Cristo, confortami.

O buon Gesù, esaudiscimi.
Dentro le tue piaghe nascondimi.
Non permettere che io mi separi da te.
Dal nemico maligno difendimi.
Nell'ora della mia morte chiamami.
E comandami di venire a te,
perché con i tuoi santi ti lodi
nei secoli dei secoli.

Amen.`,
    textLatin: `Anima Christi, sanctifica me.
Corpus Christi, salva me.
Sanguis Christi, inebria me.
Aqua lateris Christi, lava me.
Passio Christi, conforta me.

O bone Iesu, exaudi me.
Intra tua vulnera absconde me.
Ne permittas me separari a te.
Ab hoste maligno defende me.
In hora mortis meae voca me.
Et iube me venire ad te,
ut cum Sanctis tuis laudem te
in saecula saeculorum.

Amen.`,
    origin: "Papa Giovanni XXII (XIV secolo) ed Esercizi di Sant'Ignazio",
    tags: ["anima christi", "eucaristia", "comunione", "sant'ignazio", "gesù"],
  },
  {
    id: "atto-di-dolore",
    title: "Atto di Dolore",
    latinTitle: "Actus Contritionis",
    category: "Atti",
    icon: "💧",
    description: "La tradizionale preghiera di pentimento e contrizione per il sacramento della Riconciliazione.",
    textItalian: `Mio Dio, mi pento e mi dolgo con tutto il cuore dei miei peccati,
perché peccando ho meritato i tuoi castighi,
e molto più perché ho offeso te, infinitamente buono
e degno di essere amato sopra ogni cosa.

Propongo col tuo santo aiuto di non offenderti mai più
e di fuggire le occasioni prossime di peccato.

Signore, misericordia, perdonami.`,
    textLatin: `Deus meus, ex toto corde me paenitet meorum peccatorum,
eamque rem valde doleo,
quod peccando poenas a te iuste constitutas merui,
sed multo magis quod te, summum bonum, offendi.

Firmiter propono, adiuvante gratia tua,
de cetero non peccare,
peccandique occasiones proximas fugere.

Domine, misericordia, indulge mihi.`,
    origin: "Tradizione catechistica e sacramentale cattolica",
    tags: ["atto di dolore", "confessione", "perdono", "contrizione", "peccato"],
  },
  {
    id: "atto-di-fede",
    title: "Atto di Fede",
    latinTitle: "Actus Fidei",
    category: "Atti",
    icon: "🕯️",
    description: "Professione personale di adesione alla Rivelazione divina.",
    textItalian: `Mio Dio, perché sei verità infallibile,
credo fermamente tutto quello che tu hai rivelato
e la santa Chiesa ci propone a credere.

Credo in te, unico vero Dio in tre Persone uguali e distinte,
Padre, Figlio e Spirito Santo.
Credo in Gesù Cristo, Figlio di Dio, incarnato, morto e risorto per noi,
il quale darà a ciascuno, secondo i meriti, il premio o la pena eterna.

In questa fede voglio sempre vivere e morire.
Signore, accresci la mia fede.`,
    textLatin: `Domine Deus, firma fide credo
omnia et singula quae sancta Ecclesia catholica proponit,
quia tu, Deus, ea omnia revelasti, qui es aeterna veritas
et sapientia quae nec fallere nec falli potest.

In hac fide vivere et mori statuo. Amen.`,
    origin: "Compendio del Catechismo della Chiesa Cattolica",
    tags: ["atto di fede", "virtù teologali", "credo", "fede"],
  },
  {
    id: "atto-di-speranza",
    title: "Atto di Speranza",
    latinTitle: "Actus Spei",
    category: "Atti",
    icon: "⚓",
    description: "Invocazione della misericordia e della grazia eterna promessa da Cristo.",
    textItalian: `Mio Dio, spero dalla tua bontà,
per le tue promesse e per i meriti di Gesù Cristo nostro Salvatore,
la vita eterna e le grazie necessarie per meritarla
con le buone opere che io debbo e voglio fare.

Signore, che io possa goderti in eterno.`,
    textLatin: `Domine Deus, spero per gratiam tuam remissionem omnium peccatorum,
et post hanc vitam aeternam felicitatem me esse consecuturum:
quia tu promisisti, qui es infinite potens, fidelis, benignus,
et misericors.

In hac spe vivere et mori statuo. Amen.`,
    origin: "Compendio del Catechismo della Chiesa Cattolica",
    tags: ["atto di speranza", "virtù teologali", "speranza", "grazia"],
  },
  {
    id: "atto-di-carita",
    title: "Atto di Carità",
    latinTitle: "Actus Caritatis",
    category: "Atti",
    icon: "❤️",
    description: "Offerta d'amore sommo a Dio e al prossimo per amore Suo.",
    textItalian: `Mio Dio, ti amo con tutto il cuore sopra ogni cosa,
perché sei bene infinito e nostra eterna felicità;
e per amore tuo amo il prossimo mio come me stesso,
e perdono le offese ricevute.

Signore, che io ti ami sempre più.`,
    textLatin: `Domine Deus, amo te super omnia
et proximum meum propter te,
quia tu es summum, infinitum, et perfectissimum bonum,
omni dilectione dignissimum.

In hac caritate vivere et mori statuo. Amen.`,
    origin: "Compendio del Catechismo della Chiesa Cattolica",
    tags: ["atto di carità", "virtù teologali", "amore", "carità"],
  },
  {
    id: "san-michele",
    title: "Preghiera a San Michele Arcangelo",
    latinTitle: "Sancte Michael Archangele",
    category: "Devozioni",
    icon: "🛡️",
    description: "La celebre invocazione per la difesa dal maligno composta da Papa Leone XIII (1886).",
    textItalian: `San Michele Arcangelo, difendici nella lotta:
sii il nostro aiuto contro la malvagità e le insidie del diavolo.
Che Dio eserciti su di lui il suo dominio,
preghiamo supplichevoli.

E tu, principe della milizia celeste,
con la potenza divina,
incatena nell'inferno Satana
e gli altri spiriti maligni
che si aggirano per il mondo per perdere le anime.

Amen.`,
    textLatin: `Sancte Michael Archangele, defende nos in proelio;
contra nequitiam et insidias diaboli esto praesidium.
Imperet illi Deus, supplices deprecamur:
tuque, Princeps militiae caelestis,
Satanam aliosque spiritus malignos,
qui ad perditionem animarum pervagantur in mundo,
divina virtute, in infernum detrude.

Amen.`,
    origin: "Papa Leone XIII (1886)",
    tags: ["san michele", "arcangelo", "combattimento spirituale", "protezione", "leone xiii"],
  },
  {
    id: "dio-sia-benedetto",
    title: "Dio sia Benedetto (Elogi del SS. Sacramento)",
    latinTitle: "Laudes Divinae",
    category: "Eucaristiche",
    icon: "✨",
    description: "Le acclamazioni di lode e riparazione recitate nella Benedizione Eucaristica.",
    textItalian: `Dio sia benedetto.
Benedetto il suo santo Nome.
Benedetto Gesù Cristo, vero Dio e vero Uomo.
Benedetto il Nome di Gesù.
Benedetto il suo sacratissimo Cuore.
Benedetto il suo preziosissimo Sangue.
Benedetto Gesù nel santissimo Sacramento dell'altare.
Benedetto lo Spirito Santo Paraclito.
Benedetta la gran Madre di Dio, Maria Santissima.
Benedetta la sua santa e immacolata Concezione.
Benedetta la sua gloriosa Assunzione.
Benedetto il nome di Maria, Vergine e Madre.
Benedetto San Giuseppe, suo castissimo sposo.
Benedetto Dio nei suoi angeli e nei suoi santi.`,
    textLatin: `Benedictus Deus.
Benedictum Nomen Sanctum eius.
Benedictus Iesus Christus, verus Deus et verus homo.
Benedictum Nomen Iesu.
Benedictum Cor eius sacratissimum.
Benedictus Sanguis eius pretiosissimus.
Benedictus Iesus in sanctissimo altaris Sacramento.
Benedictus Sanctus Spiritus, Paraclitus.
Benedicta excelsa Mater Dei, Maria sanctissima.
Benedicta sancta eius et immaculata Conceptio.
Benedicta eius gloriosa Assumptio.
Benedictum nomen Mariae, Virginis et Matris.
Benedictus Sanctus Ioseph, eius castissimus Sponsus.
Benedictus Deus in Angelis suis, et in Sanctis suis.`,
    origin: "Luigi Felici S.J. (1797) e Papa Pio VII",
    tags: ["dio sia benedetto", "adorazione", "lodi divine", "benedizione eucaristica"],
  },
  {
    id: "ave-maris-stella",
    title: "Ave Maris Stella (Inno alla Vergine)",
    latinTitle: "Ave Maris Stella",
    category: "Mariane",
    icon: "⚓",
    description: "Uno dei più antichi e celebri inni mariani dei Vespri (VIII-IX secolo).",
    textItalian: `Ave, stella del mare,
madre gloriosa di Dio,
vergine sempre, Maria,
porta felice del cielo.

Accogli l'«Ave» dell'angelo,
muta la sorte di Eva,
dona la pace al mondo.

Spezza i legami agli oppressi,
rendi la luce ai ciechi,
scaccia da noi ogni male,
chiedi per noi ogni bene.

Mostrati Madre per tutti,
porti la nostra preghiera,
Cristo l'accolga benigno,
lui che si è fatto tuo Figlio.

Sia lode a Dio Padre,
gloria al Cristo Signore,
onore allo Spirito Santo:
unico omaggio alla Santa Trinità. Amen.`,
    textLatin: `Ave maris stella,
Dei Mater alma,
atque semper Virgo,
felix caeli porta.

Sumens illud Ave
Gabrielis ore,
funda nos in pace,
mutans Evae nomen.

Solve vincla reis,
profer lumen caecis,
mala nostra pelle,
bona cuncta posce.

Monstra te esse matrem,
sumat per te preces,
qui pro nobis natus
tulit esse tuus.

Sit laus Deo Patri,
summo Christo decus,
Spiritui Sancto,
tribus honor unus. Amen.`,
    origin: "Inno liturgico dei Vespri (VIII-IX secolo)",
    tags: ["ave maris stella", "maria", "vespri", "inno", "stella del mare"],
  },
];
