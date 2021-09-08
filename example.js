var fs = require('fs');

/* Copyright (c) 2018, 2021, Oracle and/or its affiliates. All rights reserved. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * NAME
 *   example.js
 *
 * DESCRIPTION
 *   A basic node-oracledb example using Node.js 8's async/await syntax.
 *
 *   For connection pool examples see connectionpool.js and webapp.js
 *   For a ResultSet example see resultset1.js
 *   For a query stream example see selectstream.js
 *
 *   This example requires node-oracledb 5 or later.
 *
 *****************************************************************************/

// Using a fixed Oracle time zone helps avoid machine and deployment differences
process.env.ORA_SDTZ = 'UTC';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');

// On Windows and macOS, you can specify the directory containing the Oracle
// Client Libraries at runtime, or before Node.js starts.  On other platforms
// the system library search path must always be set before Node.js is started.
// See the node-oracledb installation documentation.
// If the search path is not correct, you will get a DPI-1047 error.
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

        // For a complete list of options see the documentation.
        options = {
            outFormat: oracledb.OUT_FORMAT_OBJECT,   // query result format
            // extendedMetaData: true,               // get extra metadata
            // prefetchRows:     100,                // internal buffer allocation size for tuning
            // fetchArraySize:   100                 // internal buffer allocation size for tuning
        };

        // Query equipment logbook table
        eqmLogQuery = `select
                ENTITYKEY AS equipmentLogId,
                OBJEKTKEY AS equipmentKey,
                OBJEKTBEZ AS equipmentID,
                OBJEKTBESCH AS equipmentDescription,
                TYPKEY AS equipmentTypeKey,
                TYPBEZ AS equipmentType,
                KLASSEKEY AS equipmentClassKey,
                KLASSEBEZ AS equipmentClass,
                ISPARENT AS isParent,
                ASSEMBLEDIN AS assembledIn,
                LOGBOOKTYPE AS entryType,
                MANUALLOGCATEGORY AS category,
                KOMMKEY AS kommKey,
                KOMMBESCH AS logDescription,
                ZEITPUNKT AS executionTime,
                ZEITPUNKT_Z AS executionTimezone,
                TIMEOFENTRY AS logCreationTime,
                TIMEOFENTRY_Z AS logcreationTimezone,
                STATUSID AS statusID,
                STATUSGRUND AS reason,
                BENUTZERNAME AS userName,
                BENUTZERNAMEKONTROLLE AS controlName,
                FANR AS moNumber,
                ORDID AS orderNetworkId,
                PAKEY AS sfoNumber,
                ANSATZNR AS subBatch,
                GEBINDENR AS handlingUnitId,
                ZIELMATERIALNR AS targetMaterialNumber,
                ZIELMATERIALBEZ AS targetMaterialName,
                ZIELCHARGE AS targetBatch,
                INPUTMATERIALNO AS inputMaterialNumber,
                INPUTMATERIALNAME AS inputMaterialName,
                INPUTBATCH AS inputBatch,
                CAMPAIGN AS campaign,
                TARA AS tare,
                TARAEINHEITKEY AS tareUom,
                ARBEITSRAUM AS workroom,
                LETZTEAKTION AS lastActivity,
                CLEANINGRULEUSED AS cleaningRuleUsed,
                REQMATNO AS reqMaterial,
                REQBATCHNO AS reqBatch,
                REMMATNO AS remMaterial,
                REMBATCHNO AS remBatch,
                HASCOMMENTS AS hasComments,
                REVIEWSTATUS AS reviewStatus,
                REVIEWDATE AS reviewDate,
                REVIEWDATE_Z AS reviewDateTimezone,
                REVIEWEDBY AS reviewedBy,
                CHECKEDDURINGREVIEW AS checkedDuringReview,
                RECENTREVIEW AS recentReview,
                VERSION AS version
            from vobjektlogbuch`;

        eqmLog = await connection.execute(eqmLogQuery, binds, options);

        eqmLogCommentQuery = `select
                LOGBOOKKEY AS logbookKey,
                ENTITYKEY AS entityKey,
                COMMENTTYPE AS commentType,
                commenttext AS commentText,
                CREATEDBY AS createdBy,
                CREATEDAT AS createdAt,
                createdat_z AS createdAtTimezone,
                verifiedby AS verifiedBy,
                verifiedat AS verifiedAt,
                verifiedat_z AS verifiedAtTimezone
            from z_logbookcomment`;

        eqmLogComment = await connection.execute(eqmLogCommentQuery, binds, options);

        eqmLogReviewQuery = `select
            ENTITYKEY AS ENTITYKEY,
            STARTEDBY AS startedBy,
            STARTEDAT AS startedAt,
            STARTEDAT_Z AS startedAtTimezone,
            FINISHEDBY AS finishedBy,
            FINISHEDAT AS finishedAt,
            FINISHEDAT_Z AS finishedAtTimezone,
            VERIFIEDBY AS verifiedBy,
            VERIFIEDAT AS verifiedAt,
            verifiedat_z AS verifiedAtTimezone,
            PERIODBEGIN AS periodBegin,
            PERIODBEGIN_Z AS periodBeginTimezone,
            PERIODEND AS periodend,
            PERIODEND_Z AS periodEndTimezone,
            REVIEWPROCESSSTATE AS reviewProcessState,
            REVIEWCOMMENT AS reviewComment,
            LOGBOOKKEY AS logbookKey
        from vlogbookreview`;

        eqmLogReview = await connection.execute(eqmLogReviewQuery, binds, options);

        // console.log("Metadata: ");
        //console.dir(result.metaData, { depth: null });
        //console.log("Query results: ");
        //console.dir(result.rows, { depth: null });

        eqmLog.rows.forEach((log) => {
            eqmLogComment.rows.forEach((comment) => {
                if (log.EQUIPMENTLOGID === comment.LOGBOOKKEY) {
                    if (!log.comment) {
                        log.comment = [];
                    }
                    log.comment.push(comment);
                }
            })
            eqmLogReview.rows.forEach((review) => {
                if (log.EQUIPMENTLOGID === review.LOGBOOKKEY) {
                    if (!log.review) {
                        log.review = [];
                    }
                    log.review.push(review);
                }
            })
        })

        let jsonData = JSON.stringify(eqmLog.rows);

        fs.writeFile("test.json", jsonData, function (err) {
            if (err) {
                console.log(err);
            }
        });

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