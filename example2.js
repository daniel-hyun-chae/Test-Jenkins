//var fs = require('fs');
const { MongoClient } = require("mongodb");
const uri = "mongodb://10.78.114.232:27017/pasx-archive?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const client = new MongoClient(uri);

process.env.ORA_SDTZ = 'UTC';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');

if (process.platform === 'win32') { // Windows
    oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_19_11' });
} else if (process.platform === 'darwin') { // macOS
    oracledb.initOracleClient({ libDir: process.env.HOME + '/Downloads/instantclient_19_8' });
}

async function run() {
    let connection;
    try {
        let sql, binds, options, eqmLog, eqmLogComment;
        connection = await oracledb.getConnection(dbConfig);

        binds = {};

        options = {
            outFormat: oracledb.OUT_FORMAT_OBJECT,   // query result format
        };

        enumerationQuery = `select * from enumeration`;
        enumeration = await connection.execute(enumerationQuery, binds, options);

        eqmLogQuery = `select * from vobjektlogbuch`;
        eqmLogTemp = await connection.execute(eqmLogQuery, binds, options);
        eqmLog = eqmLogTemp.rows.map((log) => {
            return {
                equipmentLogId: log.ENTITYKEY,
                equipmentKey: log.OBJEKTKEY,
                equipmentID: log.OBJEKTBEZ,
                equipmentDescription: log.OBJEKTBESCH,
                equipmentTypeKey: log.TYPKEY,
                equipmentType: log.TYPBEZ,
                equipmentClassKey: log.KLASSEKEY,
                equipmentClass: log.KLASSEBEZ,
                isParent: (log.ISPARENT === 21 ? "Yes" : "No"),
                assembledIn: log.ASSEMBLEDIN,
                entryType: (() => {
                    let test = enumeration.rows.filter((en) => {
                        return en.MYKEY === log.LOGBOOKTYPE
                    })[0]
                    return `${test.WERTLANG} (${test.WERTKURZ})`
                })(),
                category: log.MANUALLOGCATEGORY,
                kommKey: log.KOMMKEY,
                logDescription: log.KOMMBESCH,
                executionTime: log.ZEITPUNKT,
                executionTimezone: log.ZEITPUNKT_Z,
                logCreationTime: log.TIMEOFENTRY,
                logCreationTimezone: log.TIMEOFENTRY_Z,
                statusID: log.STATUSID,
                reason: log.STATUSGRUND,
                userName: log.BENUTZERNAME,
                controlName: log.BENUTZERNAMEKONTROLLE,
                moNumber: log.FANR,
                orderNetworkId: log.ORDID,
                sfoNumber: log.PAKEY,
                subBatch: log.ANSATZNR,
                handlingUnitId: log.GEBINDENR,
                targetMaterialNumber: log.ZIELMATERIALNR,
                targetMaterialName: log.ZIELMATERIALBEZ,
                targetBatch: log.ZIELCHARGE,
                inputMaterialNumber: log.INPUTMATERIALNO,
                inputMaterialName: log.INPUTMATERIALNAME,
                inputBatch: log.INPUTBATCH,
                campaign: log.CAMPAIGN,
                tare: log.TARA,
                tareUom: (() => {
                    if (log.TARAEINHEITKEY) {
                        let test = enumeration.rows.filter((en) => {
                            return en.MYKEY === log.TARAEINHEITKEY
                        })[0]
                        return `${test.WERTLANG} (${test.WERTKURZ})`
                    }
                    return null;
                })(),
                workroom: log.ARBEITSRAUM,
                lastActivity: log.LETZTEAKTION,
                cleaningRuleUsed: (() => {
                    if (log.CLEANINGRULEUSED) {
                        let test = enumeration.rows.filter((en) => {
                            return en.MYKEY === log.CLEANINGRULEUSED
                        })[0]
                        return `${test.WERTLANG} (${test.WERTKURZ})`
                    }
                    return null;
                })(),
                reqMaterial: log.REQMATNO,
                reqBatch: log.REQBATCHNO,
                remMaterial: log.REMMATNO,
                remBatch: log.REMBATCHNO,
                hasComments: (log.HASCOMMENTS === 21 ? "Yes" : "No"),
                reviewStatus: (() => {
                    if (log.REVIEWSTATUS) {
                        let test = enumeration.rows.filter((en) => {
                            return en.MYKEY === log.REVIEWSTATUS
                        })[0]
                        return `${test.WERTLANG} (${test.WERTKURZ})`
                    }
                    return null;
                })(),
                reviewDate: log.REVIEWDATE,
                reviewDateTimezone: log.REVIEWDATE_Z,
                reviewedBy: log.REVIEWEDBY,
                checkedDuringReview: (log.CHECKEDDURINGREVIEW === 21 ? "Yes" : "No"),
                recentReview: log.RECENTREVIEW,
                version: log.VERSION
            }
        })

        eqmLogCommentQuery = `select * from z_logbookcomment`;
        eqmLogCommentTemp = await connection.execute(eqmLogCommentQuery, binds, options);
        eqmLogComment = eqmLogCommentTemp.rows.map((comment) => {
            return {
                logbookKey: comment.LOGBOOKKEY,
                entityKey: comment.ENTITYKEY,
                commentType: (() => {
                    if (comment.COMMENTTYPE) {
                        let test = enumeration.rows.filter((en) => {
                            return en.MYKEY === comment.COMMENTTYPE
                        })[0]
                        return `${test.WERTLANG} (${test.WERTKURZ})`
                    }
                    return null;
                })(),
                commentText: comment.COMMENTTEXT,
                createdBy: comment.CREATEDBY,
                createdAt: comment.CREATEDAT,
                createdAtTimezone: comment.CREATEDAT_Z,
                verifiedBy: comment.VERIFIEDBY,
                verifiedAt: comment.VERIFIEDAT,
                verifiedAtTimezone: comment.VERIFIED_Z
            }
        })

        eqmLogReviewQuery = `select * from vlogbookreview`;
        eqmLogReviewTemp = await connection.execute(eqmLogReviewQuery, binds, options);
        eqmLogReview = eqmLogReviewTemp.rows.map((review) => {
            return {
                entityKey: review.ENTITYKEY,
                startedBy: review.STARTEDBY,
                startedAt: review.STARTEDAT,
                startedAtTimezone: review.STARTEDAT_Z,
                finishedBy: review.FINISHEDBY,
                finishedAt: review.FINISHEDAT,
                finishedAtTimezone: review.FINISHEDAT_Z,
                verifiedBy: review.VERIFIEDBY,
                verifiedAt: review.VERIFIEDAT,
                verifiedAtTimezone: review.VERIFIEDAT_Z,
                periodBegin: review.PERIODBEGIN,
                periodBeginTimezone: review.PERIODBEGIN_Z,
                periodend: review.PERIODEND,
                periodEndTimezone: review.PERIODEND_Z,
                reviewProcessState: (() => {
                    if (review.REVIEWPROCESSSTATE) {
                        let test = enumeration.rows.filter((en) => {
                            return en.MYKEY === review.REVIEWPROCESSSTATE
                        })[0]
                        return `${test.WERTLANG} (${test.WERTKURZ})`
                    }
                    return null;
                })(),
                reviewComment: review.REVIEWCOMMENT,
                logbookKey: review.LOGBOOKKEY
            }
        })

        // console.log("Metadata: ");
        //console.dir(result.metaData, { depth: null });
        //console.log("Query results: ");
        //console.dir(result.rows, { depth: null });

        eqmLog.forEach((log) => {
            eqmLogComment.forEach((comment) => {
                if (log.equipmentLogId === comment.logbookKey) {
                    if (!log.comment) {
                        log.comment = [];
                    }
                    log.comment.push(comment);
                }
            })
            eqmLogReview.forEach((review) => {
                if (log.equipmentLogId === review.logbookKey) {
                    if (!log.review) {
                        log.review = [];
                    }
                    log.review.push(review);
                }
            })
        })

        async function runMongo() {
            try {
                // Connect the client to the server
                await client.connect();
                // Establish and verify connection
                const database = client.db('archive');
                const equipmentLogs = database.collection('equipmentLogs');
                await equipmentLogs.drop();
                await equipmentLogs.insertMany(eqmLog);
            } finally {
                // Ensures that the client will close when you finish/error
                await client.close();
            }
        }

        await runMongo().catch(console.dir);

        // let jsonData = JSON.stringify(eqmLog);

        // fs.writeFile("test.json", jsonData, function (err) {
        //     if (err) {
        //         console.log(err);
        //     }
        // });

    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

run();