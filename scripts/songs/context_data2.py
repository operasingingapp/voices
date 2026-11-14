# -*- coding: utf-8 -*-
"""The context of the songs of the second batch (batches 6-11 and the cycles), written for Sottovoce in our own words;
dates checked against IMSLP's work pages and the composers' catalogues. Same fields as context_data.py; build_context.py
merges both. W(...) gives a cycle's songs their shared 'written' line."""

CYCLES2 = {
    "kindertotenlieder": {"title": "Kindertotenlieder", "composer": "Mahler", "count": 5,
        "overview": "Songs on the Death of Children: five of the more than four hundred poems Friedrich Rückert wrote in 1833-34 "
        "after two of his children died of scarlet fever. Mahler set them between 1901 and 1904, before any loss of his own; "
        "his elder daughter died three years later. The songs move from the shock of the first sunrise after the death, "
        "through memory and denial, to a storm and, at the very end, a lullaby."},
    "vierernste": {"title": "Vier ernste Gesänge", "composer": "Brahms", "count": 4,
        "overview": "Four Serious Songs, Op. 121, written in May 1896, while Clara Schumann lay dying; they were Brahms's last "
        "songs, and he died the next year. The words are from Luther's Bible: three meditations on death from Ecclesiastes and "
        "Sirach, and Paul's words on love from the First Letter to the Corinthians, which answer them."},
    "bilitis": {"title": "Trois chansons de Bilitis", "composer": "Debussy", "count": 3,
        "overview": "Three songs to prose poems from Pierre Louÿs's Les Chansons de Bilitis (1894), which Louÿs passed off as "
        "translations of an ancient Greek poet he had invented. Debussy set them in 1897-98. A young woman's first love, told "
        "in three scenes, from a lesson on the shepherd's pipe to a winter forest where the old gods are dead."},
    "baudelaire": {"title": "Cinq poèmes de Baudelaire", "composer": "Debussy", "count": 5,
        "overview": "Five poems from Charles Baudelaire's Les Fleurs du mal (1857), set by Debussy in 1887-89 and first "
        "published in 1890 in a private edition of 150 copies. Written under Wagner's spell, they are long, harmonically rich "
        "and very demanding for the pianist as well as the singer."},
    "poemedunjour": {"title": "Poème d'un jour", "composer": "Fauré", "count": 3,
        "overview": "Poem of a Day, Op. 21: three songs to poems by Charles Grandmougin, written in 1878. A love affair in "
        "three moments: the meeting, the passion, and the light, rueful farewell."},
    "serreschaudes": {"title": "Serres chaudes", "composer": "Chausson", "count": 5,
        "overview": "Hothouses, Op. 24: five poems from Maurice Maeterlinck's first collection (1889), set by Chausson in "
        "1893-96. Maeterlinck's Symbolist poems pile up strange, airless images of confinement, weariness and longing; "
        "Chausson's settings are among the richest French songs of the decade."},
    "moerike": {"title": "Mörike-Lieder", "composer": "Wolf", "count": 53,
        "overview": "Fifty-three songs to poems by Eduard Mörike, written by Hugo Wolf in a burst of creation in 1888 and "
        "published in 1889. Wolf put the poet's name before his own on the title page: every song begins from the "
        "words, and the piano is an equal partner."},
    "eichendorffwolf": {"title": "Eichendorff-Lieder", "composer": "Wolf", "count": 20,
        "overview": "Twenty songs to poems by Joseph von Eichendorff, written by Hugo Wolf between 1880 and 1888 and published "
        "in 1889. Wolf deliberately chose the poet's lighter and more robust side, soldiers, students, musicians and "
        "rogues, leaving the moonlit Eichendorff to Schumann."},
    "shakespearequilter": {"title": "Three Shakespeare Songs", "composer": "Quilter", "count": 3,
        "overview": "Three songs, Op. 6 (1905), to songs from Shakespeare's comedies: two sung by the jester Feste in Twelfth "
        "Night and one by Amiens in As You Like It. They are among the most sung English songs of the century."},
    "tojulia": {"title": "To Julia", "composer": "Quilter", "count": 6,
        "overview": "Six songs, Op. 8 (1905), to love poems addressed to 'Julia' by the seventeenth-century poet Robert Herrick, "
        "from his collection Hesperides (1648). Quilter wrote them for the tenor Gervase Elwes; a short piano prelude and "
        "interlude frame the cycle."},
    "shropshiresomervell": {"title": "A Shropshire Lad", "composer": "Somervell", "count": 10,
        "overview": "Ten poems from A. E. Housman's A Shropshire Lad (1896), set by Arthur Somervell in 1904: the first song "
        "cycle on Housman, before the better-known ones by Butterworth and Vaughan Williams. Young men in love, at fairs, "
        "on hills and marching off to soldier; many will die young."},
    "gounodsix": {"title": "Six mélodies", "composer": "Gounod", "count": 6,
        "overview": "Six songs written between 1842 and 1850 and published in 1855: settings of Renaissance poets (Passerat, "
        "Baïf) and of Hugo and Musset, in Gounod's graceful early style."},
    "mignon": {"title": "Gesänge aus Wilhelm Meister", "composer": "Schubert", "count": 4,
        "overview": "Four songs, D 877 (1826), to the poems sung in Goethe's novel Wilhelm Meisters Lehrjahre (1795-96) by "
        "Mignon, a mysterious child rescued from a troupe of acrobats, and the old Harper. Mignon longs for the Italy she was "
        "stolen from and keeps a secret she has sworn never to tell."},
}

YEARS = {
    "winterreise1": ("1827", "Composed in February 1827 (D 911); published in January 1828 in Winterreise, Part 1"),
    "winterreise2": ("1827", "Composed in October 1827 (D 911); published in December 1828 in Winterreise, Part 2"),
    "muellerin": ("1823", "Composed in 1823 (D 795); published in 1824 in Die schöne Müllerin"),
    "schwanengesang": ("1828", "Composed in 1828 (D 957); published in 1829 in Schwanengesang"),
    "dichterliebe": ("1840", "Composed in May 1840 (Op. 48); published in 1844 in Dichterliebe"),
    "frauenliebe": ("1840", "Composed in July 1840 (Op. 42); published in 1843 in Frauenliebe und -leben"),
    "liederkreis39": ("1840", "Composed in May 1840 (Op. 39); published in 1842 in the Liederkreis"),
    "myrthen": ("1840", "Composed in 1840 (Op. 25); published in 1840 in Myrthen, Schumann's wedding gift to Clara"),
    "gesellen": ("1885", "Composed in 1884-85; published in 1897 in Lieder eines fahrenden Gesellen"),
    "kindertotenlieder": ("1904", "Composed between 1901 and 1904; published in 1905 in the Kindertotenlieder"),
    "wesendonck": ("1858", "Composed in 1857-58; published in 1862 in the Wesendonck-Lieder"),
    "vierernste": ("1896", "Composed in May 1896 (Op. 121); published in 1896"),
    "ariettes": ("1887", "Composed in 1885-87; published in 1888 in the Ariettes oubliées, revised in 1903"),
    "bilitis": ("1898", "Composed in 1897-98; published in 1899"),
    "baudelaire": ("1889", "Composed in 1887-89; published in 1890"),
    "poemedunjour": ("1878", "Composed in 1878 (Op. 21); published in 1880"),
    "serreschaudes": ("1896", "Composed in 1893-96 (Op. 24); published in 1897"),
    "moerike": ("1888", "Composed in 1888; published in 1889 in the Mörike-Lieder"),
    "eichendorffwolf": ("1888", "Composed between 1880 and 1888; published in 1889 in the Eichendorff-Lieder"),
    "shakespearequilter": ("1905", "Composed and published in 1905 (Op. 6)"),
    "tojulia": ("1905", "Composed and published in 1905 (Op. 8), for the tenor Gervase Elwes"),
    "shropshiresomervell": ("1904", "Composed and published in 1904"),
    "gounodsix": ("1850", "Composed between 1842 and 1850; published in 1855 in Six mélodies"),
}


def S(cycle, no, story, music, poem=None, written=None, year=None, part=None):
    y, w = YEARS[part or cycle]
    return dict(year=year or y, written=written or w, cycle=cycle if cycle in CYCLES_ALL else None, no=no, story=story,
                poem=poem or POEMS.get(cycle, ""), music=music)


POEMS = {
    "winterreise": "Words by Wilhelm Müller (1794-1827), from his Winterreise poems (1823-24).",
    "muellerin": "Words by Wilhelm Müller, from Die schöne Müllerin (1820).",
    "dichterliebe": "Words by Heinrich Heine, from the Lyrisches Intermezzo in his Buch der Lieder (1827).",
    "frauenliebe": "Words by Adelbert von Chamisso (1781-1838), from Frauen-Liebe und Leben (1830).",
    "liederkreis39": "Words by Joseph von Eichendorff (1788-1857).",
    "kindertotenlieder": "Words by Friedrich Rückert (1788-1866), from his Kindertotenlieder, written in 1833-34 and published after his death, in 1872.",
    "wesendonck": "Words by Mathilde Wesendonck (1828-1902).",
    "gesellen": "Words by Gustav Mahler, written after an unhappy love affair in Kassel.",
    "ariettes": "Words by Paul Verlaine, from Romances sans paroles (1874).",
    "bilitis": "Words by Pierre Louÿs (1870-1925), from Les Chansons de Bilitis (1894).",
    "baudelaire": "Words by Charles Baudelaire (1821-1867), from Les Fleurs du mal (1857).",
    "poemedunjour": "Words by Charles Grandmougin (1850-1930).",
    "serreschaudes": "Words by Maurice Maeterlinck (1862-1949), from Serres chaudes (1889).",
    "moerike": "Words by Eduard Mörike (1804-1875).",
    "eichendorffwolf": "Words by Joseph von Eichendorff (1788-1857).",
    "tojulia": "Words by Robert Herrick (1591-1674), from Hesperides (1648).",
    "shropshiresomervell": "Words by A. E. Housman (1859-1936), from A Shropshire Lad (1896).",
}

CYCLES_ALL = set(CYCLES2) | {"winterreise", "muellerin", "schwanengesang", "dichterliebe", "frauenliebe", "liederkreis39",
                             "myrthen", "gesellen", "wesendonck", "ariettes"}

W1, W2 = "winterreise1", "winterreise2"

SONGS2 = {
    # Mahler
    "mahler-wenn-mein-schatz-hochzeit-macht": S("gesellen", 1,
        "On the day his sweetheart marries another man, he shuts himself in his little room and weeps. Outside the world is "
        "blooming and the birds sing; he begs them not to sing, because for him spring is over.",
        "The wedding is in the piano, a quick, almost cheerful dance; his grief interrupts it in slow phrases. The middle, "
        "with the flowers and birds, is unexpectedly tender."),
    "mahler-die-zwei-blauen-augen-von-meinem-schatz": S("gesellen", 4,
        "Her two blue eyes sent him out into the wide world. He leaves at night across the dark heath, and lies down under "
        "a lime tree, whose blossoms snow down on him; there he forgets everything, and all is well again.",
        "A slow funeral march, which Mahler reused in the third movement of his First Symphony. The lime-tree passage turns "
        "to major and seems to stop time; the ending fades away."),
    "mahler-nun-will-die-sonn-so-hell-aufgehn": S("kindertotenlieder", 1,
        "The morning after the death: the sun rises as brightly as if nothing had happened in the night. The misfortune "
        "happened to me alone; the sun shines on everyone. Do not hold the night inside you, sink it in eternal light.",
        "Two bare lines, voice and piano, move against each other like a duet of grief. The stillness is the point: no "
        "outburst until the very end."),
    "mahler-nun-seh-ich-wohl-warum-so-dunkle-flammen": S("kindertotenlieder", 2,
        "Now the father understands why his children's eyes flashed such dark flames: they wanted to tell him they would "
        "soon be gone, that the eyes he saw would one day be stars.",
        "Long, searching phrases over shifting harmonies; the music keeps reaching for a resolution it does not find."),
    "mahler-wenn-dein-mutterlein": S("kindertotenlieder", 3,
        "When the mother comes in through the door, the father turns his head, not to her, but to the place beside her "
        "where his little daughter's face used to appear.",
        "A slow, plodding bass under a lament. The voice has to sustain long lines very quietly."),
    "mahler-oft-denk-ich-sie-sind-nur-ausgegangen": S("kindertotenlieder", 4,
        "Often he thinks the children have only gone out for a walk and will soon be home. The day is fine; they have only "
        "gone ahead to the hills, and we will catch them up there in the sunshine.",
        "The one song in major: an easy walking pace that only half hides the denial in the words."),
    "mahler-in-diesem-wetter": S("kindertotenlieder", 5,
        "In such a storm he would never have let the children out; but they were carried out, and he could say nothing. "
        "Now they rest as if in their mother's house, frightened by no storm, sheltered by God's hand.",
        "A violent storm in the piano for most of the song; then it clears into a slow lullaby in major, the only consolation "
        "in the cycle."),
    # Wagner
    "wagner-der-engel": S("wesendonck", 1,
        "In childhood she heard of angels who leave heaven's bliss for the earth. Now an angel has come down to her too, and "
        "carries her soul up, away from all pain.",
        "Gentle, rising phrases over soft, flowing chords: the shortest and simplest of the five songs."),
    "wagner-stehe-still": S("wesendonck", 2,
        "A plea to the rushing wheel of time to stand still, so that in the gaze of two lovers, soul drowned in soul, all "
        "desire can be fulfilled.",
        "It begins with the whirring of time in the piano and ends in an ecstatic stillness. It needs a big voice."),
    "wagner-im-treibhaus": S("wesendonck", 3,
        "In a hothouse, tropical plants lean toward the light, exiled from their homeland. The singer sees herself in them: "
        "a plant far from home, longing, weeping heavy drops.",
        "Marked 'study for Tristan und Isolde': its music became the prelude to Act 3 of the opera. Slow, heavy and still."),
    "wagner-schmerzen": S("wesendonck", 4,
        "Every evening the sun weeps red tears as it sinks, and every morning it rises again in glory. So pain, which "
        "nature itself gives, brings joy: she thanks it.",
        "Broad and heroic, with a great climax; a short song that needs a full, steady voice."),
    # Brahms, Vier ernste Gesänge
    "brahms-denn-es-gehet-dem-menschen-wie-dem-vieh": S("vierernste", 1,
        "The same fate befalls man and beast: as one dies, so does the other. All come from dust and return to dust. Who "
        "knows whether the spirit of man goes upward? So let a man rejoice in his work, for that is his portion.",
        "A dark, walking bass and a stern melody; in the middle a fast, restless section on 'all is vanity'.",
        poem="Words from Luther's Bible: Ecclesiastes 3:19-22."),
    "brahms-ich-wandte-mich-und-sahe": S("vierernste", 2,
        "The preacher looks at all the injustice done under the sun: the tears of the oppressed, with no one to comfort "
        "them. He praises the dead above the living, and better than both, the one who was never born.",
        "Slow and grieving, with a long, singing line over a gently pulsing accompaniment.",
        poem="Words from Luther's Bible: Ecclesiastes 4:1-3."),
    "brahms-o-tod-wie-bitter-bist-du": S("vierernste", 3,
        "O death, how bitter you are to one who lives in peace and prosperity. But to the poor, the old and the weary, who "
        "have nothing left to hope for, how good you are.",
        "The first half falls in heavy, descending phrases; the second turns to major, and the same music becomes gentle "
        "and consoling.",
        poem="Words from Luther's Bible: Sirach (Ecclesiasticus) 41:1-2."),
    "brahms-wenn-ich-mit-menschen-und-mit-engelzungen-redete": S("vierernste", 4,
        "Though I spoke with the tongues of men and of angels, and had not love, I would be a sounding brass. Now we see "
        "through a glass, darkly; then face to face. Faith, hope and love remain, and the greatest of these is love.",
        "The answer to the first three songs: urgent at first, then a broad, glowing melody for 'face to face' and a radiant "
        "close.",
        poem="Words from Luther's Bible: Paul's First Letter to the Corinthians, 13:1-3 and 12-13."),
    # Debussy
    "debussy-l-ombre-des-arbres": S("ariettes", 3,
        "The shadow of the trees on the misty river dies away like smoke, while the turtle-doves lament in the branches. "
        "The traveller sees himself in this pale landscape, and his drowned hopes weep in the leaves.",
        "Very slow and quiet, with sparse chords. Verlaine took his epigraph from Cyrano de Bergerac."),
    "debussy-paysages-belges-chevaux-de-bois": S("ariettes", 4,
        "A merry-go-round at a fair: turn, good wooden horses, turn a hundred times, a thousand times, while soldiers and "
        "maids ride and the crowd jostles. Evening falls, the stars come out, and still they turn.",
        "The piano spins without stopping, and the voice rides it. At the end the music slows as night comes down. Fast, "
        "breathless French that must stay clear."),
    "debussy-aquarelles-ii-spleen": S("ariettes", 6,
        "The roses were all red, the ivy all black. Dear, at your slightest movement all my despair revives. The sky is too "
        "blue, the sea too green, the air too sweet; I fear you will leave me.",
        "Short, slow and weary. Verlaine gave the poem its English title."),
    "debussy-la-flute-de-pan": S("bilitis", 1,
        "On the day of the Hyacinth festival he gave her a shepherd's pipe, and taught her to play it, lips on lips. It is "
        "late; the frogs are singing; her mother will never believe she spent so long looking for her lost girdle.",
        "The piano imitates the pipe in a free, wandering line. Quiet, intimate and almost spoken."),
    "debussy-la-chevelure": S("bilitis", 2,
        "He tells her his dream: her hair was round his neck like a black necklace, binding them together, so that they "
        "became one. When he finished, he looked at her so tenderly that she lowered her eyes.",
        "The most sensual of the three, building slowly to a climax and then sinking back to a murmur."),
    "debussy-le-tombeau-des-naiades": S("bilitis", 3,
        "In a frozen winter forest she follows the tracks of a satyr. He tells her the satyrs are dead, and the nymphs too; "
        "he breaks the ice of the spring where they used to laugh, and lifts out a piece, like a face.",
        "A steady walking rhythm through the snow; the ending is cold and still."),
    "debussy-le-balcon": S("baudelaire", 1,
        "The poet recalls evenings on the balcony with his beloved, lit by the coal fire, veiled in rosy mist: her breath, "
        "her heart, the vows and perfumes. Will they come back, as the sun rises again after sinking in the sea?",
        "The longest of the five, with a refrain that returns at the end of each stanza. Rich, Wagnerian harmony."),
    "debussy-harmonie-du-soir": S("baudelaire", 2,
        "Evening: flowers sway like censers, sounds and scents turn in the air, a violin trembles like a wounded heart. "
        "Melancholy waltz and languid dizziness. The sky is a great altar; the memory of you shines in me.",
        "Baudelaire's poem repeats each stanza's second and fourth lines in the next, and the music circles in the same way, "
        "like a slow waltz."),
    "debussy-le-jet-d-eau": S("baudelaire", 3,
        "Rest, beloved, your eyes are tired. In the courtyard a fountain chatters night and day. His soul, lit by pleasure, "
        "rises like the fountain's spray and falls back in tears.",
        "The piano's falling figures are the fountain; the refrain about it returns between the stanzas."),
    "debussy-recueillement": S("baudelaire", 4,
        "Be calm, my Sorrow, and hold yourself still. Evening is falling. Give me your hand; come away from the crowd. Look "
        "at the dead years leaning over the balconies of the sky; listen, dear, to the soft night walking.",
        "Slow and hushed, with a great outburst at its centre and an almost motionless close."),
    "debussy-la-mort-des-amants": S("baudelaire", 5,
        "The lovers will have beds full of light scents and couches deep as tombs. Their two hearts will be two torches, "
        "and one evening an angel will come to rekindle the dulled mirrors and the dead flames.",
        "The shortest of the five: radiant and calm, a vision rather than a lament."),
    # Fauré, Poème d'un jour
    "faure-rencontre": S("poemedunjour", 1,
        "The poet had been sad and alone; then he met her, and his heart was filled with light. He hopes his love may be "
        "a balm for her too.",
        "Gentle flowing arpeggios under a warm, simple melody."),
    "faure-toujours": S("poemedunjour", 2,
        "You ask me to be silent, to forget? Ask the sea to dry up its waves, ask the night to lose its stars, ask the soul "
        "to forget what it loves. Always.",
        "Fast and passionate, with driving chords: the stormy centre of the cycle."),
    "faure-adieu": S("poemedunjour", 3,
        "Everything passes: flowers, the joy of a day, love. With a smile he lets her go: forget each other, as everything "
        "on earth is forgotten.",
        "Simple, light and rueful; one of Fauré's most often sung songs."),
    # Chausson, Serres chaudes
    "chausson-serre-chaude": S("serreschaudes", 1,
        "A hothouse in the middle of a forest, its doors closed for ever: the poet sees in it images of people shut in and "
        "longing, and asks when the rain, the snow, the wind will come into the glasshouse.",
        "Dense, close harmony and an anxious, insistent line."),
    "chausson-serre-d-ennui": S("serreschaudes", 2,
        "Blue weariness in the heart, seen in the half-light like a moon through glass: a dreamlike picture of listless "
        "longing.",
        "A pale, floating setting, quieter than the first song."),
    "chausson-lassitude": S("serreschaudes", 3,
        "They no longer know where they are going: tired of everything, they sleep without dreams, and kisses have lost "
        "their meaning.",
        "Slow and drained, with long sustained chords."),
    "chausson-fauves-las": S("serreschaudes", 4,
        "The poet watches the weary beasts of his own desires, the passions that prowl and then lie down exhausted, in the "
        "half-light of his soul.",
        "Heavy, slow, with dark harmonies and a restless middle."),
    "chausson-oraison": S("serreschaudes", 5,
        "A prayer: Lord, have pity on my weakness. The poet's soul is pale and powerless; he asks for strength and light.",
        "Simple and hymn-like after the four strange songs before it; the cycle ends in quiet supplication."),
    # Wolf, Mörike
    "wolf-der-tambour": S("moerike", 5,
        "A young drummer on campaign daydreams: if his mother were a witch she could come with the regiment and make the "
        "food magic, and his drum would be a pot of sauerkraut. Then he thinks of his sweetheart, and his heart is heavy.",
        "Drum rolls in the piano, comic and affectionate; the mood turns tender when he thinks of his girl."),
    "wolf-nimmersatte-liebe": S("moerike", 9,
        "Love is never satisfied: the more it has, the more it wants. Lovers bite each other's lips; even wise King Solomon "
        "was no different.",
        "Witty and sensuous, with a laughing, comic ending in the piano."),
    "wolf-auf-einer-wanderung": S("moerike", 15,
        "Walking into a little town at sunset, the poet hears a girl singing from a window full of roses, and is spellbound. "
        "He walks on in a daze, past the brook, and calls on the Muse: you have touched my heart with a breath of love.",
        "One of Wolf's greatest songs: an easy walking start, a magical moment at the window, and a huge climax on "
        "'O Muse'."),
    # Wolf, Eichendorff
    "wolf-der-freund": S("eichendorffwolf", 1,
        "A song for the friend who stands firm in storms: when everything sways, he holds fast, and his faith carries others "
        "with it.",
        "Strong, steady and hymn-like."),
    "wolf-der-musikant": S("eichendorffwolf", 2,
        "A wandering musician loves wandering for life; he would gladly marry a pretty girl, but what would she live on? "
        "So he plays his songs and moves on.",
        "Light and carefree, with a guitar-like accompaniment."),
    "wolf-das-standchen": S("eichendorffwolf", 4,
        "Late at night an old man hears a young student singing a serenade under a window, and remembers when he too sang "
        "to his love, who is now dead.",
        "The piano plays the student's serenade like a lute, while the voice sings the old man's memories over it."),
    "wolf-der-soldat-i": S("eichendorffwolf", 5,
        "A soldier rides through the night on his horse to his sweetheart's castle; he is no fine gentleman, but she loves "
        "him.",
        "A brisk riding rhythm and a cheerful, proud tune."),
    "wolf-der-soldat-ii": S("eichendorffwolf", 6,
        "A soldier's view of love: you must dare and seize your luck in a rush, as in battle.",
        "Short, bold and martial."),
    "wolf-die-zigeunerin": S("eichendorffwolf", 7,
        "A gypsy girl at the crossroads laughs at the men who come to her: the hunter, the count, she teases them all and "
        "belongs to none.",
        "Playful and wild, with laughter written into the vocal line."),
    "wolf-nachtzauber": S("eichendorffwolf", 8,
        "Do you hear the springs murmuring in the night, the forest dreaming, the old songs of the earth? The poet calls "
        "his beloved out into the enchanted night.",
        "One of Wolf's most magical songs: slow, shimmering, full of rustling figures in the piano."),
    "wolf-der-schreckenberger": S("eichendorffwolf", 9,
        "A swaggering adventurer drinks to his lady and to fortune, boasting of his luck and his sword.",
        "A rollicking drinking song with plenty of bravado."),
    "wolf-der-glucksritter": S("eichendorffwolf", 10,
        "A soldier of fortune woos Fortune herself: when she is coy, he does not give up, but courts her all the harder.",
        "Comic and lively, with mock-heroic gestures in the piano."),
    "wolf-lieber-alles": S("eichendorffwolf", 11,
        "Being a soldier is dangerous, studying is hard, poetry pays nothing: he would rather be everything at once.",
        "A quick, humorous song that skips from one idea to the next."),
    "wolf-heimweh": S("eichendorffwolf", 12,
        "Whoever wants to go abroad should take his love with him; the poet, far from home, greets the hills and woods of "
        "Germany with longing.",
        "Warm, broad and nostalgic, rising to a glowing climax."),
    "wolf-der-scholar": S("eichendorffwolf", 13,
        "A wandering student sets off in the finest weather, free and cheerful, with his books left behind.",
        "Bright and carefree, with a striding accompaniment."),
    "wolf-der-verzweifelte-liebhaber": S("eichendorffwolf", 14,
        "A lover in despair tries everything, studying, drinking, rhyming, and nothing helps: a comic picture of youthful "
        "lovesickness.",
        "Fast and comic, full of exaggerated gestures."),
    "wolf-unfall": S("eichendorffwolf", 15,
        "Walking across the land one night, the poet fell asleep, and Cupid shot him with an arrow; he has not been the "
        "same since.",
        "Light and humorous, with a sudden 'shot' in the piano."),
    "wolf-liebesgluck": S("eichendorffwolf", 16,
        "He has found his love, and the whole world seems to rejoice with him.",
        "Exuberant and bright, with a jubilant ending."),
    "wolf-seemans-abschied": S("eichendorffwolf", 17,
        "A sailor bids farewell to a girl who would not have him, and mocks the landlubbers he leaves behind; the sea is his "
        "true love.",
        "Rough, rollicking and boisterous: a sea song with a swagger."),
    "wolf-erwartung": S("eichendorffwolf", 18,
        "In the evening the lover waits, every rustle making his heart beat faster, for the one who is coming.",
        "Expectant, quietly pulsing music."),
    "wolf-die-nacht": S("eichendorffwolf", 19,
        "The night is like a silent sea: joy and sorrow and love's lament come and go like waves, and wishes drift like "
        "clouds.",
        "Very slow and still, with long sustained harmonies."),
    "wolf-waldmadchen": S("eichendorffwolf", 20,
        "A forest girl, a flickering will-o'-the-wisp of a creature, leads the hunter on through the woods, always out of "
        "reach.",
        "Very fast and elusive, with a whirling accompaniment; a virtuoso ending to the set."),
    "wolf-hoch-begluckt-in-deiner-liebe": dict(year="1889",
        written="Composed in 1889; No. 40 of the Goethe-Lieder (published 1890)",
        story="Suleika speaks: happy in her lover's love, she does not blame chance, for chance brought them together; if "
        "it was a robbery, it was a robbery she welcomed.",
        poem="Words by Johann Wolfgang von Goethe, from the Book of Suleika in his West-östlicher Divan (1819).",
        music="Light, ardent and quick, with a joyful sweep."),
    # Schubert, single songs
    "schubert-das-rosenband": dict(year="1815", written="Composed in September 1815 (D 280); published in 1837",
        story="In the shade of spring he found her sleeping and tied her with rose garlands. She woke, looked at him, and "
        "life hung on that look; all around them became Elysium.",
        poem="Words by Friedrich Gottlieb Klopstock (1724-1803).",
        music="A short, graceful song with a gently rocking accompaniment."),
    "schubert-auflosung": dict(year="1824", written="Composed in March 1824 (D 807); published in 1842",
        story="Hide yourself, sun, and you, world: the poet hears inner voices of such power that he wants only to dissolve "
        "in them, to vanish into the ecstasy of the soul.",
        poem="Words by Johann Mayrhofer (1787-1836), Schubert's friend and housemate.",
        music="Overwhelming and orchestral, with surging tremolos in the piano and a huge climax: one of Schubert's most "
        "powerful songs."),
    "schubert-der-zwerg": dict(year="1822", written="Composed around 1822 (D 771); published in 1823 as Op. 22 No. 1",
        story="On a ship at dusk sit the queen and her dwarf. She has betrayed him for the king; the dwarf says she will die, "
        "and strangles her with a red silk cord, then throws her body into the sea and vanishes.",
        poem="Words by Matthäus von Collin (1779-1824).",
        music="A ballad with an ominous, repeated figure in the piano and three characters for one singer; very dramatic."),
    "schubert-meeres-stille": dict(year="1815", written="Composed in June 1815 (D 216); published in 1821 as Op. 3 No. 2",
        story="Deep stillness on the water: the sea lies motionless, no breath of wind, a deathly calm. The sailor looks "
        "anxiously at the smooth surface all around.",
        poem="Words by Johann Wolfgang von Goethe, written in 1795.",
        music="Slow, spread chords throughout: almost nothing moves, and the voice must sustain an even, quiet line."),
    "schubert-dass-sie-hier-gewesen": dict(year="1823", written="Composed in 1823 (D 775); published in 1826 as Op. 59 No. 2",
        story="That the east wind breathes perfume into the air shows she has been here; that tears flow here shows I was "
        "here.",
        poem="Words by Friedrich Rückert, from Östliche Rosen (1822).",
        music="Famous for its opening: harmonies that seem to float without a key until the word 'gewesen' settles them."),
    "schubert-lachen-und-weinen": dict(year="1823", written="Composed in 1823 (D 777); published in 1826 as Op. 59 No. 4",
        story="Laughing and weeping at any hour come from love in so many ways. In the morning I laughed with joy; why do "
        "I weep now in the evening light?",
        poem="Words by Friedrich Rückert, from Östliche Rosen (1822).",
        music="Light and quick, with a sudden shift to minor when the weeping begins."),
    "schubert-wandrers-nachtlied": dict(year="1824", written="Composed in 1824 (D 768); published in 1827 as Op. 96 No. 3",
        story="Over all the mountain tops is peace; in the treetops you hardly feel a breath; the birds are silent in the "
        "forest. Only wait: soon you too will rest.",
        poem="Words by Johann Wolfgang von Goethe, pencilled on the wall of a hunting hut on the Kickelhahn in 1780.",
        music="Fourteen bars, almost motionless; the repeated 'balde' at the end must stay quiet and still."),
    "schubert-die-sterne": dict(year="1828", written="Composed in January 1828 (D 939); published in 1828 as Op. 96 No. 1",
        story="The stars in the night sky greet the lonely wanderer, teach love and point the way, so they are blessed.",
        poem="Words by Karl Gottfried von Leitner (1800-1890).",
        music="A steady, twinkling repeated-note accompaniment and a cheerful, strophic melody."),
    "schubert-lied-der-mignon-heiss-mich-nicht-reden": dict(year="1826", cycle="mignon", no=2,
        written="Composed in January 1826 (D 877 No. 2); published in 1827 as Op. 62",
        story="Mignon: do not ask me to speak; I must keep silent, I have sworn it. I would gladly show you my heart, but "
        "fate forbids it; only a god could open my lips.",
        poem="Words by Johann Wolfgang von Goethe, from Wilhelm Meisters Lehrjahre (1795-96).",
        music="Restless and dark, with an outburst in the middle; the secret pressing against the silence."),
    "schubert-lied-der-mignon-nur-wer-die-sehnsucht-kennt": dict(year="1826", cycle="mignon", no=4,
        written="Composed in January 1826 (D 877 No. 4); published in 1827 as Op. 62",
        story="Only one who knows longing knows what I suffer. Alone, cut off from all joy, I look at the sky; the one who "
        "loves me is far away.",
        poem="Words by Johann Wolfgang von Goethe, from Wilhelm Meisters Lehrjahre (1795-96).",
        music="Schubert set this poem six times; this is the last and best known. A slow, aching melody rising to a "
        "desperate climax."),
    # Brahms, single songs
    "brahms-botschaft": dict(year="1868", written="Composed in 1868 (Op. 47 No. 1); published in 1868",
        story="Blow gently, breeze, around my beloved's cheeks, and if she asks how I am, tell her my suffering is endless, "
        "and yet I hope, for she thinks of me.",
        poem="Words by Georg Friedrich Daumer (1800-1875), after the Persian poet Hafiz.",
        music="Light, airy and quick, the piano's figures fluttering like the breeze."),
    "brahms-sonntag": dict(year="1860", written="Composed in 1860 (Op. 47 No. 3); published in 1868",
        story="All week he has not seen his lovely sweetheart. On Sunday he saw her standing at her door: the thousand "
        "times lovely girl; would she were with me today.",
        poem="Words by Ludwig Uhland, from his collection of folk songs (Alte hoch- und niederdeutsche Volkslieder).",
        music="Simple and folk-like, two verses, with a bright, cheerful lilt."),
    "brahms-junge-lieder-i": dict(year="1873", written="Composed in 1873 (Op. 63 No. 5); published in 1874",
        story="My love is green like the lilac bush, and my beloved is fair like the sun; she shines on the lilac and fills "
        "it with scent and joy.",
        poem="Words by Felix Schumann (1854-1879), Robert and Clara Schumann's youngest son and Brahms's godson, written when he was a teenager.",
        music="Ardent and surging, with a rushing accompaniment; a big, joyful song."),
    "brahms-heimweh-ii": dict(year="1874", written="Composed in 1874 (Op. 63 No. 8); published in 1874",
        story="O if only I knew the way back, the dear way to the land of childhood. Why did I leave my mother's hand to "
        "seek happiness? I long to rest there again.",
        poem="Words by Klaus Groth (1819-1899), Brahms's friend.",
        music="A warm, nostalgic melody over flowing arpeggios: one of Brahms's best loved songs."),
    "brahms-wie-bist-du-meine-konigin": dict(year="1864", written="Composed in 1864 (Op. 32 No. 9); published in 1865",
        story="How blissful you are, my queen, when you are gentle. Every flower, every desert, every death becomes delight "
        "near you.",
        poem="Words by Georg Friedrich Daumer, after Hafiz.",
        music="Strophic, with the refrain 'wonnevoll' (blissful) ending each verse in a long, melting phrase."),
    "brahms-dein-blaues-auge": dict(year="1873", written="Composed in 1873 (Op. 59 No. 8); published in 1873",
        story="Your blue eyes are so still, I see into their depths. Other eyes burned me; yours are as cool as a lake, and "
        "heal me.",
        poem="Words by Klaus Groth.",
        music="Short and tender, with a sudden darkening for the burning eyes."),
    "brahms-regenlied": dict(year="1873", written="Composed in 1873 (Op. 59 No. 3); published in 1873",
        story="Rain, pour down; wake in me the dreams I dreamt as a child, when the drops splashed on the sand and I stood "
        "barefoot in the warm summer rain.",
        poem="Words by Klaus Groth.",
        music="The piano's repeated notes are the rain; Brahms used the melody again in the finale of his first Violin "
        "Sonata, Op. 78."),
    "brahms-am-sonntag-morgen": dict(year="1868", written="Composed around 1868 (Op. 49 No. 1); published in 1868",
        story="On Sunday morning, dressed in your best, you went walking with another, I know it; people came and told me, "
        "and I laughed; then I went home and wept all night.",
        poem="Words by Paul Heyse (1830-1914), from his Italienisches Liederbuch (1860), translations of Italian popular verse.",
        music="Begins lightly; the weeping at the end turns dark and passionate."),
    "brahms-der-schmied": dict(year="1858", written="Composed in 1858 (Op. 19 No. 4); published in 1862",
        story="I hear my sweetheart's hammer ringing far and wide. He stands, black, at his forge, and when I pass by the "
        "bellows roar and the fire leaps up.",
        poem="Words by Ludwig Uhland (1787-1862).",
        music="The piano is the hammer on the anvil; a short, sturdy song."),
    # Quilter
    "quilter-come-away-death": S("shakespearequilter", 1,
        "Come away, death, and lay me in sad cypress; I am slain by a cruel maid. Let no friend greet my coffin; bury me "
        "where no true lover will find my grave.",
        "Slow and solemn, but more wistful than tragic.",
        poem="Words by William Shakespeare: Feste's song from Twelfth Night (Act 2, Scene 4)."),
    "quilter-o-mistress-mine": S("shakespearequilter", 2,
        "O mistress mine, where are you roaming? Stay, your true love is coming. What is love? Not hereafter: present mirth "
        "has present laughter. Come kiss me, sweet and twenty; youth won't last.",
        "Light, quick and graceful: Quilter's most famous song.",
        poem="Words by William Shakespeare: Feste's song from Twelfth Night (Act 2, Scene 3)."),
    "quilter-blow-blow-thou-winter-wind": S("shakespearequilter", 3,
        "Blow, winter wind, you are not as unkind as man's ingratitude. Most friendship is feigning, most loving mere folly; "
        "so heigh-ho, the holly, this life is most jolly.",
        "Vigorous and bitter-sweet, with a stormy piano and a jaunty refrain.",
        poem="Words by William Shakespeare: Amiens's song from As You Like It (Act 2, Scene 7)."),
    "quilter-the-bracelet": S("tojulia", 1,
        "Why does he tie a silk bracelet round her wrist? To show that, though he binds her, he is the true captive.",
        "Graceful and light, in the old style of Herrick's verse."),
    "quilter-the-maiden-blush": S("tojulia", 2,
        "As cherries blush and roses, so Julia blushes: the poet lists the loveliest pinks and reds in nature to describe her "
        "face.",
        "Tender and gently swaying."),
    "quilter-to-daisies": S("tojulia", 3,
        "Do not close yet, daisies, though the evening comes: wait until Julia goes to sleep, then shut your eyes too.",
        "Slow and lulling, almost a lullaby."),
    "quilter-the-night-piece": S("tojulia", 4,
        "Let the glow-worm lend you its eyes, and the stars light your way to me, Julia, through the night; no will-o'-the-"
        "wisp will lead you astray.",
        "Mysterious and nocturnal, with soft, glimmering figures in the piano."),
    "quilter-julias-hair": S("tojulia", 5,
        "Julia's hair, scattered by the wind, is like a net, a sea of gold: the poet is caught in it.",
        "Short, flowing and ardent."),
    "quilter-cherry-ripe": S("tojulia", 6,
        "Cherry ripe, ripe, ripe, I cry: come buy. Where do the cherries grow? On Julia's lips, there where the cherries "
        "grow.",
        "A street seller's cry turned into a quick, sparkling song that ends the cycle brightly."),
    # Somervell
    "somervell-loveliest-of-trees-the-cherry-now": S("shropshiresomervell", 1,
        "At Eastertide the cherry is hung with white blossom. He is twenty; fifty springs are little room to see things in "
        "bloom, so he will go out to see the cherry hung with snow.",
        "A gentle, flowing opening to the cycle. Compare it with Butterworth's darker setting of the same poem."),
    "somervell-when-i-was-one-and-twenty": S("shropshiresomervell", 2,
        "When he was one-and-twenty a wise man told him: give away your money, but not your heart. He did not listen; now "
        "he is two-and-twenty, and it is true.",
        "Light and wry, two verses, with a sigh at the end."),
    "somervell-there-pass-the-careless-people": S("shropshiresomervell", 3,
        "The careless people pass by, calling their souls their own; he stands apart, thinking of a lover who has left him.",
        "Restrained and sad."),
    "somervell-in-summer-time-on-bredon": S("shropshiresomervell", 4,
        "In summer on Bredon hill the church bells ring and the lovers lie listening. They will be married, he says; but in "
        "winter she goes to church alone, to her funeral, and now he says to the bells: I hear you, I will come.",
        "The bells are in the piano; the mood turns from summer happiness to winter grief."),
    "somervell-the-street-sounds-to-the-soldiers-tread": S("shropshiresomervell", 5,
        "The street rings with the soldiers' tread; the lad watches them march by and wishes them well, knowing many will not "
        "come back.",
        "A march rhythm in the piano."),
    "somervell-on-the-idle-hill-of-summer": S("shropshiresomervell", 6,
        "Lying sleepy on a summer hill, he hears far off the drums and fifes of soldiers marching to die. Woman bore me, he "
        "says; I will rise and go.",
        "Drowsy at first, then the distant drum comes nearer."),
    "somervell-white-in-the-moon-the-long-road-lies": S("shropshiresomervell", 7,
        "White in the moonlight lies the long road that leads him away from his love; he walks on, knowing that the road "
        "goes round the world and will bring him back.",
        "A walking rhythm and a long, sad line."),
    "somervell-think-no-more-lad-laugh-be-jolly": S("shropshiresomervell", 8,
        "Think no more, lad: laugh, be jolly; thought is what spoils young men's lives. Drink, dance, and leave thinking to "
        "old age.",
        "Quick and forced in its cheer."),
    "somervell-into-my-heart-an-air-that-kills": S("shropshiresomervell", 9,
        "An air from a far country blows into his heart: what are those blue remembered hills? It is the land of lost "
        "content, the happy highways where he went and cannot come again.",
        "Very short and quiet; the most famous poem of the book."),
    "somervell-the-lads-in-their-hundreds": S("shropshiresomervell", 10,
        "The lads come in their hundreds to Ludlow fair. Many of them will never grow old, and no one can tell which: they "
        "will carry their good looks to the grave.",
        "A lilting fair-day tune darkened by the poem's knowledge."),
    # Gounod
    "gounod-le-premier-jour-de-mai": S("gounodsix", 1,
        "On the first day of May the poet greets his love with the spring, hoping she will be as gentle as the season.",
        "Graceful and bright, in the manner of an old French song.",
        poem="Words by Jean Passerat (1534-1602)."),
    "gounod-o-ma-belle-rebelle": S("gounodsix", 2,
        "O my lovely rebel, so harsh to me: will you never let me kiss your eyes and lips? Your cruelty is killing me.",
        "Tender and pleading, with a lute-like accompaniment.",
        poem="Words by Jean-Antoine de Baïf (1532-1589)."),
    "gounod-aubade": S("gounodsix", 3,
        "A morning song: the lover sings to his beloved at dawn, calling her to wake.",
        "Light and fresh, with a serenading accompaniment.",
        poem="Words by Victor Hugo."),
    "gounod-le-lever": S("gounodsix", 5,
        "Enough sleep, my beauty: dawn is breaking, the horses are ready; come, let us ride out together into the morning.",
        "Brisk and lively, with a galloping rhythm.",
        poem="Words by Alfred de Musset (1810-1857)."),
    "gounod-venise": S("gounodsix", 6,
        "Night in Venice: not a gondola moving, the lions of St Mark asleep, the lovers at their windows; the poet invites "
        "his beloved to the hour of love.",
        "A lilting barcarolle, the gondola's rocking in the piano.",
        poem="Words by Alfred de Musset."),
    "gounod-le-soir": dict(year="1842", written="Composed around 1840-42 (CG 441); published in 1863 in Gounod's 20 Mélodies",
        story="Evening falls; the poet sits alone in the twilight and watches the first star. A ray of moonlight seems to "
        "carry the soul of someone he loved and lost.",
        poem="Words by Alphonse de Lamartine (1790-1869), from his Méditations poétiques (1820).",
        music="Gounod wrote it during his years in Rome: slow, warm and calm."),
}

# Dichterliebe 2-16
D = "dichterliebe"
SONGS2.update({
    "schumann-aus-meinen-tranen-spriessen": S(D, 2, "From his tears spring many blooming flowers, and his sighs become a choir of nightingales. If she loves him, he will give her all the flowers, and the nightingale will sing at her window.", "Very short and simple, almost a continuation of the first song."),
    "schumann-die-rose-die-lilie": S(D, 3, "The rose, the lily, the dove, the sun: he loved them all once. Now he loves only her, the little, the fine, the pure, the one.", "A quick, breathless patter: the whole song lasts about thirty seconds."),
    "schumann-wenn-ich-in-deine-augen-seh": S(D, 4, "When he looks into her eyes all his pain vanishes; when he kisses her mouth he is healed. But when she says 'I love you', he must weep bitterly.", "Slow and tender; the last line, 'so muss ich weinen bitterlich', is the heart of it."),
    "schumann-ich-will-meine-seele-tauchen": S(D, 5, "He wants to dip his soul into the cup of a lily, so that it breathes a song of his beloved, a song that trembles like the kiss she once gave him.", "Rippling arpeggios like a breath of air; quiet and quick."),
    "schumann-und-wusstens-die-blumen": S(D, 8, "If the flowers knew how deeply he is wounded, they would weep with him; the nightingales and the stars would comfort him. But they cannot know: only she knows, and she has torn his heart.", "Restless, fluttering accompaniment, and a violent piano postlude."),
    "schumann-das-ist-ein-floten-und-geigen": S(D, 9, "Flutes and violins, trumpets blaring: it is her wedding dance, and the angels are sobbing.", "The piano plays a whirling waltz throughout; the voice weaves in and out of it. A famous piano part."),
    "schumann-hor-ich-das-liedchen-klingen": S(D, 10, "When he hears the little song she used to sing, his heart nearly bursts; he goes up to the woods to weep out his grief.", "Slow, aching and simple, with a long, sad piano postlude."),
    "schumann-ein-jungling-liebt-ein-madchen": S(D, 11, "A young man loves a girl who loves another; that one loves another girl and marries her. It is an old story, yet always new, and whoever it happens to, it breaks his heart.", "A jaunty, almost mocking tune that hides the bitterness."),
    "schumann-am-leuchtenden-sommermorgen": S(D, 12, "On a bright summer morning he walks in the garden. The flowers whisper to him: do not be angry with our sister, you sad, pale man.", "Gentle arpeggios and a still, floating line; the piano's postlude is famous."),
    "schumann-ich-hab-im-traum-geweinet": S(D, 13, "He wept in a dream that she lay in her grave; he dreamt she had left him; he dreamt she loved him still, and he is still weeping.", "Voice and piano alternate in silence-filled phrases: some of the starkest bars Schumann wrote."),
    "schumann-allnachtlich-im-traume": S(D, 14, "Every night in dreams he sees her; she greets him kindly, gives him a sprig of cypress, and whispers a word. When he wakes, the cypress is gone and he has forgotten the word.", "Short, hesitant phrases with pauses; a dream half remembered."),
    "schumann-aus-alten-marchen-winkt-es": S(D, 15, "From old fairy tales a magic land beckons, with flowers in golden evening light and singing trees; if only he could go there and be happy. But the vision melts away like foam.", "Bright and lively, the longest of the fantasy songs, ending in sudden sadness."),
    "schumann-die-alten-bosen-lieder": S(D, 16, "The old, bitter songs and dreams: he will bury them in a huge coffin, carried by twelve giants and sunk in the sea. Do you know why the coffin must be so heavy? He is burying his love and his pain in it.", "Heavy and grand, then a tender piano postlude that remembers the twelfth song: the last word of the cycle is the piano's."),
})
# Frauenliebe 2-8
F = "frauenliebe"
SONGS2.update({
    "schumann-er-der-herrlichste-von-allen": S(F, 2, "He, the most wonderful of all, so gentle and good: she sees him far above her, like a star, and wishes him the worthiest of brides, even if her heart breaks.", "Fast, ardent and full of admiration."),
    "schumann-ich-kanns-nicht-fassen": S(F, 3, "She cannot believe it: he has chosen her. It must be a dream; she wants to die in that dream, drowned in endless joy.", "Breathless and excited, with outbursts of disbelief."),
    "schumann-helft-mir-ihr-schwestern": S(F, 5, "Help me, sisters, to dress for my wedding: put on the myrtles. She greets her sisters with joy and a touch of sadness as she leaves them.", "A bright, busy wedding song that ends in a wedding march."),
    "schumann-susser-freund-du-blickest": S(F, 6, "Dear friend, you look at me in wonder; come close, let me whisper in your ear why I am crying. She is expecting their child.", "Slow, intimate and hushed: the turning point of the cycle."),
    "schumann-an-meinem-herzen": S(F, 7, "At my heart, at my breast: the young mother sings of her happiness with her baby; only a mother knows what it is to love.", "Quick and jubilant, almost bursting with joy."),
    "schumann-nun-hast-du-mir-den-ersten-schmerz-getan": S(F, 8, "Now you have caused me my first pain: you sleep, hard and pitiless man, the sleep of death. She withdraws into herself, to her memories of him.", "Stark recitative-like phrases; then the long piano postlude brings back the music of the first song, as a memory."),
})
# Müllerin 3-19
M = "muellerin"
SONGS2.update({
    "schubert-halt": S(M, 3, "The miller sees a mill among the alders and hears the wheels: is this where the brook was leading him?", "The piano's turning figures are the mill wheels."),
    "schubert-danksagung-an-den-bach": S(M, 4, "Was this what you meant, my brook? Did she send you? He thanks the brook for bringing him here.", "Gentle and grateful, flowing like the water."),
    "schubert-am-feierabend": S(M, 5, "If he had a thousand arms he would work so hard the miller's daughter would notice him. But at the end of the day she says goodnight to all the lads alike.", "Busy, energetic piano for the work; then a quieter, disappointed close."),
    "schubert-der-neugierige": S(M, 6, "He asks the brook, not the flowers or stars: does she love me? Yes or no, two little words.", "Tender and questioning, with a beautiful hush on 'ja' and 'nein'."),
    "schubert-ungeduld": S(M, 7, "He wants to carve it into every tree, write it on every stone: dein ist mein Herz, my heart is yours and shall be for ever.", "Fast and impatient, each verse ending in an outburst; strophic."),
    "schubert-morgengruss": S(M, 8, "Good morning, lovely miller's girl: why do you turn away? He will stand far off and only look at your window.", "A gentle, swaying morning greeting; strophic."),
    "schubert-des-mullers-blumen": S(M, 9, "Blue flowers grow by the brook, the colour of her eyes. He plants them under her window to whisper to her of him in her dreams.", "A gentle lullaby rhythm; strophic."),
    "schubert-tranenregen": S(M, 10, "They sit together by the brook in the moonlight and look into the water. Tears fill his eyes; she says it is going to rain, and goes home.", "A calm, tender song with a sudden chill at the end."),
    "schubert-mein": S(M, 11, "Mine! He wants the whole world to hear it: the beloved miller's girl is mine.", "Exuberant and fast, the high point of his happiness."),
    "schubert-pause": S(M, 12, "He has hung his lute on the wall, wrapped in a green ribbon: his heart is too full to sing.", "Quiet and hesitant, the piano plucking like the lute."),
    "schubert-mit-dem-grunen-lautenbande": S(M, 13, "She likes green so much; he gives her the green ribbon from his lute for her hair. Green is the colour of hope.", "Light and charming, strophic."),
    "schubert-der-jager": S(M, 14, "What is the hunter doing here by the mill stream? He should go back to his forest; let him shoot the boars that dig up her cabbage instead.", "Fast and agitated, with hunting-horn figures."),
    "schubert-eifersucht-und-stolz": S(M, 15, "Where are you rushing, brook? After the hunter? Go and tell her that he, the miller, is playing happily, not crying.", "Rushing and furious, the brook in the piano racing on."),
    "schubert-die-liebe-farbe": S(M, 16, "He will dress in green, the colour of weeping willow and cypress; his love loves green, the hunter's colour.", "A single repeated note tolls in the piano throughout, like a bell."),
    "schubert-die-bose-farbe": S(M, 17, "He would like to go out into the wide world, if only it were not so green. He hates the colour now: it is the hunter's.", "Violent and bitter, with hunting horns turning sinister."),
    "schubert-trockne-blumen": S(M, 18, "The flowers she gave him will lie with him in his grave. When she walks past and thinks: he was true, then spring will come again.", "A slow, desolate song that turns briefly to major at the dream of spring."),
    "schubert-der-muller-und-der-bach": S(M, 19, "The miller and the brook talk: where a true heart dies of love, the lilies wilt. The brook promises rest; the miller lies down in it.", "A dialogue: the miller in minor, the brook answering in major."),
})
# Liederkreis Op. 39
LK = "liederkreis39"
SONGS2.update({
    "schumann-in-der-fremde-i": S(LK, 1, "Far from home, behind the red lightning, the clouds come from his homeland; but his father and mother are long dead and no one knows him there. Soon he too will rest, and the forest will rustle over him.", "Rippling guitar-like arpeggios and a still, melancholy line."),
    "schumann-intermezzo": S(LK, 2, "He carries her image deep in his heart; it looks at him so freshly and gladly. His heart sings an old, beautiful song that flies to her.", "Syncopated, breathless accompaniment and a warm melody."),
    "schumann-die-stille": S(LK, 4, "No one knows how happy he is: only one person knows. He wishes he were a bird, flying over the sea to heaven.", "Light and secretive, sung quietly."),
    "schumann-schone-fremde": S(LK, 6, "The treetops rustle and shudder as if the old gods were walking around. In the moonlight the night speaks of a great happiness to come.", "Rustling, excited accompaniment and an ecstatic climax."),
    "schumann-auf-einer-burg": S(LK, 7, "An old knight sits asleep on watch in a ruined castle, turned to stone. Below on the Rhine a wedding party sails by, and the beautiful bride is weeping.", "Archaic, slow counterpoint like old church music; it ends unresolved."),
    "schumann-in-der-fremde-ii": S(LK, 8, "He hears the brooks and doesn't know where he is; a nightingale sings as if of old times. It is as though his love were waiting in the old castle; but she died long ago.", "Restless, flowing accompaniment and a mood between dream and grief."),
    "schumann-wehmuth": S(LK, 9, "He can sing as if he were happy, but tears flow in secret. So nightingales sing out of their cage, and people rejoice, not knowing the pain in the song.", "A slow, simple melody over gentle chords."),
    "schumann-zwielicht": S(LK, 10, "Twilight spreads its wings; trees shudder. Beware: if you have a deer you love, do not let it graze alone; trust no friend in this hour. Something goes lost in the night: be watchful.", "Eerie, chromatic counterpoint in the piano; one of Schumann's darkest songs."),
})
# Myrthen
MY = "myrthen"
SONGS2.update({
    "schumann-freisinn": S(MY, 2, "Let me sit in my saddle; you stay in your houses and tents. I ride freely into the distance, and over my cap there are only stars.", "Brisk and proud, a riding rhythm.", poem="Words by Johann Wolfgang von Goethe, from his West-östlicher Divan (1819)."),
    "schumann-jemand": S(MY, 4, "My heart is sad, and I cannot tell you why: it is for someone. I would do anything for someone, keep someone safe.", "A tender, folk-like song with a gentle lilt.", poem="Words by Robert Burns ('For the sake o' Somebody'), in Wilhelm Gerhard's German translation."),
    "schumann-sitz-ich-allein": S(MY, 5, "When I sit alone, where better than with myself? I drink my wine alone; no one stops me, and I have my own thoughts.", "A cheerful tavern song.", poem="Words by Johann Wolfgang von Goethe, from the West-östlicher Divan."),
    "schumann-setze-mir-nicht": S(MY, 6, "Don't bang the jug down in front of me, you lout; whoever brings me wine should look friendly, or the wine goes sour.", "A short, gruff comic song.", poem="Words by Johann Wolfgang von Goethe, from the West-östlicher Divan."),
    "schumann-talismane": S(MY, 8, "God's is the Orient, God's is the Occident; north and south rest peacefully in his hands. He, the only just one, wants what is right for all.", "A grand, contrapuntal hymn; the 'Amen' is set in fugal style.", poem="Words by Johann Wolfgang von Goethe, from the West-östlicher Divan."),
    "schumann-lied-der-suleika": S(MY, 9, "How well I understand your wishes, beloved: you long to be near me, as I long for you.", "Warm and lilting.", poem="Words by Marianne von Willemer, published by Goethe as his own in the West-östlicher Divan."),
    "schumann-die-hochlander-witwe": S(MY, 10, "A Highland widow laments: she once had cattle and sheep and a husband; all was lost when he fell in battle.", "Fast and agitated, full of grief and anger.", poem="Words by Robert Burns ('The Highland Widow's Lament'), in Wilhelm Gerhard's German translation."),
    "schumann-lieder-der-braut-ii-lass-mich-ihm-am-busen-hangen": S(MY, 12, "Let me hang on his breast, mother, let me stay; she has found her place with her bridegroom.", "Tender and devoted.", poem="Words by Friedrich Rückert, from his Liebesfrühling."),
    "schumann-hochlandisches-wiegenlied": S(MY, 14, "Sleep, little child: your father is a Highlander, a brave man, and you will be one too.", "A gentle rocking lullaby.", poem="Words by Robert Burns, in Wilhelm Gerhard's German translation."),
    "schumann-aus-den-hebraischen-gesangen-mein-herz-ist-schwer": S(MY, 15, "My heart is heavy: strike the harp, let its notes break through the darkness, or my heart will burst.", "Dark and heavy, with a harp-like middle section.", poem="Words by Lord Byron ('My Soul is Dark', from Hebrew Melodies, 1815), in Karl Julius Körner's German translation."),
    "schumann-ratsel": S(MY, 16, "A riddle: what is whispered in heaven and muttered in hell, found in a sigh but lost in a whisper? The letter H.", "Light and witty.", poem="Words by Catherine Maria Fanshawe (1765-1834), in German translation."),
    "schumann-zwei-venetianische-lieder-i-leis-rudern-hin": S(MY, 17, "Row gently, gondolier, to her window; let no one hear us glide through the night to my love.", "A quiet, rocking barcarolle.", poem="Words by Thomas Moore, in Ferdinand Freiligrath's German translation."),
    "schumann-zwei-venetianische-lieder-ii-wenn-durch-die-piazza": S(MY, 18, "When the evening breeze moves over the Piazza, come, masked, to meet me; I will know you by the sign we agreed.", "Quick and conspiratorial, a Venetian carnival scene.", poem="Words by Thomas Moore, in Ferdinand Freiligrath's German translation."),
    "schumann-hauptmanns-weib": S(MY, 19, "The captain's wife rides with her husband to war; wherever he goes, she goes too.", "A brisk military march.", poem="Words by Robert Burns, in Wilhelm Gerhard's German translation."),
    "schumann-was-will-die-einsame-trane": S(MY, 21, "What does this lonely tear want? It is left over from long ago; the others have all flowed away. It too should melt away now.", "Slow and simple.", poem="Words by Heinrich Heine, from Die Heimkehr in his Buch der Lieder (1827)."),
    "schumann-niemand": S(MY, 22, "I have a wife of my own; I'll share her with nobody. I'll take no one's cuckold's horns, and give none.", "Short, jolly and defiant.", poem="Words by Robert Burns ('I hae a wife o' my ain'), in Wilhelm Gerhard's German translation."),
    "schumann-im-westen": S(MY, 23, "He looks out over the sea to the west, where his love is; the wind carries his longing to her.", "Wistful and lilting.", poem="Words by Robert Burns, in Wilhelm Gerhard's German translation."),
    "schumann-du-bist-wie-eine-blume": S(MY, 24, "You are like a flower, so sweet and pure; looking at you, sadness creeps into my heart. I want to lay my hands on your head and pray God keeps you so.", "Very short, with soft repeated chords; one of Schumann's most famous songs.", poem="Words by Heinrich Heine, from Die Heimkehr in his Buch der Lieder (1827)."),
    "schumann-aus-den-ostlichen-rosen": S(MY, 25, "A greeting from the eastern roses: wherever you are, may their scent reach you.", "Gentle and warm.", poem="Words by Friedrich Rückert, from Östliche Rosen (1822)."),
    "schumann-zum-schluss": S(MY, 26, "To end: here I have woven you a wreath, imperfect as it is; in heaven it will be made whole.", "A quiet, devoted ending to the book.", poem="Words by Friedrich Rückert."),
})
# Schwanengesang
SG = "schwanengesang"
SONGS2.update({
    "schubert-liebesbotschaft": S(SG, 1, "Rushing brook, so silver bright: hurry to my beloved, bring her my greeting, refresh her flowers, and sing her to sleep.", "The piano's rippling figures are the brook, as in Die schöne Müllerin.", poem="Words by Ludwig Rellstab (1799-1860)."),
    "schubert-kriegers-ahnung": S(SG, 2, "Soldiers sleep around the campfire; one keeps watch and thinks of his love, sensing he will not see her again.", "A dark march, a tender memory, and a desperate climax.", poem="Words by Ludwig Rellstab."),
    "schubert-aufenthalt": S(SG, 5, "Roaring river, rustling forest, towering rock: this is my resting place. As wave follows wave, so my tears flow.", "Powerful driving triplets; one of Schubert's most dramatic songs.", poem="Words by Ludwig Rellstab."),
    "schubert-in-der-ferne": S(SG, 6, "Woe to the one who flees, who leaves his mother's house behind and wanders in the world: no one blesses his road.", "Bleak and slow, with strange harmonies.", poem="Words by Ludwig Rellstab."),
    "schubert-abschied": S(SG, 7, "Farewell, you merry town: the rider waves goodbye to everything, on his trotting horse, and rides away.", "The piano trots throughout; cheerful and quick.", poem="Words by Ludwig Rellstab."),
    "schubert-der-atlas": S(SG, 8, "I, unhappy Atlas: I must carry a world, the whole world of sorrows. You proud heart, you wanted to be infinitely happy, or infinitely wretched: now you are wretched.", "Massive and defiant, with a tremolo bass; it needs power.", poem="Words by Heinrich Heine, from Die Heimkehr in his Buch der Lieder (1827)."),
    "schubert-ihr-bild": S(SG, 9, "He stood in dark dreams gazing at her portrait, and her face seemed to come alive, to smile, with tears in her eyes. And I cannot believe that I have lost you.", "Very bare: voice and piano in octaves, with silences between.", poem="Words by Heinrich Heine, from Die Heimkehr in his Buch der Lieder (1827)."),
    "schubert-das-fischermadchen": S(SG, 10, "Lovely fisher girl, bring your boat to land; sit with me and hold hands. My heart is like the sea, with storms and tides and many pearls in its depths.", "A gently rocking barcarolle.", poem="Words by Heinrich Heine, from Die Heimkehr in his Buch der Lieder (1827)."),
    "schubert-die-stadt": S(SG, 11, "At dusk the town appears on the horizon, wrapped in mist. The boatman rows; the sun rises once more and shows him the place where he lost his beloved.", "Eerie arpeggios in the piano, like wind on water.", poem="Words by Heinrich Heine."),
    "schubert-der-doppelganger": S(SG, 13, "A quiet night in the empty street where his beloved used to live. A man stands there, staring up and wringing his hands in pain; the moon shows his face: it is his own.", "Four slow chords repeated like a ground bass; the voice rises to a terrifying climax. One of the greatest songs ever written.", poem="Words by Heinrich Heine."),
    "schubert-die-taubenpost": S(SG, 14, "He has a carrier pigeon that flies to his beloved with his letters: her name is Longing.", "Light and charming, Schubert's last song.", poem="Words by Johann Gabriel Seidl (1804-1875)."),
})
# Winterreise
WR = "winterreise"
SONGS2.update({
    "schubert-die-wetterfahne": S(WR, 2, "The wind plays with the weather vane on her house: he should have known by it that she was fickle. What do they care inside? Their daughter is a rich bride.", "A sharp, gusting figure in the piano.", part=W1),
    "schubert-gefrorne-thranen": S(WR, 3, "Frozen tears fall from his cheeks; he did not notice he was weeping. Tears, are you so lukewarm that you turn to ice?", "Slow, halting steps in the piano.", part=W1),
    "schubert-erstarrung": S(WR, 4, "He searches the snow for her footprints, where they walked in the green meadow. He wants to melt the ice with his tears; his heart is frozen, her image frozen inside it.", "Driving triplets and a restless line.", part=W1),
    "schubert-wasserfluth": S(WR, 6, "His tears fall into the snow; when the snow melts, it will flow with the brook through the town to her house.", "Slow, heavy triplets; a long, sad line.", part=W1),
    "schubert-auf-dem-flusse": S(WR, 7, "The rushing river is frozen over. He carves her name and the date into the ice: is my heart like this river under its crust, raging?", "Quiet, frozen staccato that breaks into turmoil at the end.", part=W1),
    "schubert-ruckblick": S(WR, 8, "He runs from the town as if pursued, remembering how it greeted him when he came: birds, lime trees, her eyes. He wishes he could go back and stand before her house.", "Fast and agitated, then a gentle memory in major.", part=W1),
    "schubert-irrlicht": S(WR, 9, "A will-o'-the-wisp lures him into the rocky depths; he does not mind. Every path leads to the goal; every river reaches the sea, every sorrow its grave.", "Wandering, uncertain phrases.", part=W1),
    "schubert-rast": S(WR, 10, "Only now that he stops, in a charcoal burner's hut, does he feel how tired he is; and his heart, at rest, feels the worm inside it.", "A trudging tread in the piano.", part=W1),
    "schubert-fruhlingstraum": S(WR, 11, "He dreamt of colourful flowers and green meadows; then the cocks crowed and he woke to cold darkness and frost flowers on the window.", "Three moods: a sweet dream, a harsh awakening, and longing.", part=W1),
    "schubert-einsamkeit": S(WR, 12, "Like a dark cloud passing over the treetops, he goes his way alone. The air is calm, the world bright; he was happier when storms raged.", "Slow walking steps, with a stormy outburst.", part=W1),
    "schubert-die-post": S(WR, 13, "The post horn sounds in the street: why does my heart leap? There's no letter for you, my heart. Still you want to know how she is.", "The post horn and the galloping horse in the piano.", part=W2),
    "schubert-der-greise-kopf": S(WR, 14, "Frost has made his hair white, and he rejoiced that he was old; but it melted. How far it is to the grave.", "Slow, with long, sustained phrases.", part=W2),
    "schubert-die-krahe": S(WR, 15, "A crow has followed him from the town, circling overhead. Will it wait for his body? Let me see loyalty unto the grave.", "The piano's circling figure is the crow's flight.", part=W2),
    "schubert-letzte-hoffnung": S(WR, 16, "He watches a leaf on a tree and hangs his hope on it. If the leaf falls, his hope falls with it, and he weeps on his hope's grave.", "Fragmented, trembling rhythms like falling leaves.", part=W2),
    "schubert-im-dorfe": S(WR, 17, "In the village dogs bark, chains rattle; people sleep, dreaming of what they don't have. Bark me away, he tells the dogs: I'm done with dreams.", "Growling bass trills and a quiet, bitter line.", part=W2),
    "schubert-der-sturmische-morgen": S(WR, 18, "A stormy morning has torn the sky's grey clothes; red flames dart between the clouds. That is a morning after my own heart: it is winter, cold and wild.", "Very short and violent.", part=W2),
    "schubert-tauschung": S(WR, 19, "A light dances ahead of him; he follows it, knowing it is a trick. Only a wretch would let himself be lured by a bright, warm house and a loving soul.", "A deceptively light, lilting dance.", part=W2),
    "schubert-der-wegweiser": S(WR, 20, "Why does he avoid the roads others take and seek hidden paths? One signpost stands unmoved before his eyes; he must take a road from which no one has returned.", "A steady walking rhythm and a repeated note at the end, like a death knell.", part=W2),
    "schubert-das-wirthshaus": S(WR, 21, "His path leads to a graveyard: this is the inn he will stay at. But all the rooms are taken. Then onward, my faithful staff.", "A slow hymn-like song.", part=W2),
    "schubert-muth": S(WR, 22, "When snow blows in his face he shakes it off; when his heart speaks, he sings loud and bright. If no god is on earth, we will be gods ourselves.", "Defiant and fast, bitterly cheerful.", part=W2),
    "schubert-die-nebensonnen": S(WR, 23, "He saw three suns in the sky. They are not his suns; he once had three, but the best two are gone. Let the third one go too; in the dark he will be better.", "A slow, sarabande-like song.", part=W2),
})
SONGS2["schumann-lieder-der-braut-i-mutter-mutter"] = S(MY, 11,
    "Mother, mother, do not think that because I love him I love you less. Ever since I have known him, I love you more: "
    "you gave me the heart that learned to love him.",
    "Tender and simple, a daughter's quiet reassurance.", poem="Words by Friedrich Rückert, from his Liebesfrühling.")
