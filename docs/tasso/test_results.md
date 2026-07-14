get test results of multiple orders and patientids 

{
    "success": true,
    "message": null,
    "data": {
        "results": [
            {
                "id": "1c80676f-5740-4f1e-a58d-64a425a6113f",
                "patientId": "4d625b8f-4731-4273-a543-b2e840ae9339",
                "orderId": "11cb5d3a-93f6-41d2-af99-f1105d893caf",
                "createdAt": "2026-01-03T00:01:58.831Z",
                "updatedAt": null,
                "renderedResults": {
                    "resourceType": "Bundle",
                    "identifier": {
                        "system": "urn:ietf:rfc:3986",
                        "value": "urn:uuid:1c80676f-5740-4f1e-a58d-64a425a6113f"
                    },
                    "type": "collection",
                    "entry": [
                        {
                            "resource": {
                                "resourceType": "Specimen",
                                "id": "bloodSample",
                                "receivedTime": "2026-01-02T14:15:00.000Z",
                                "collection": {
                                    "collectedDateTime": "2026-01-02T18:43:00.000Z"
                                }
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "https://crlcorp.com",
                                            "code": "T511",
                                            "display": "ALBUMIN"
                                        }
                                    ],
                                    "text": "ALBUMIN"
                                },
                                "specimen": {
                                    "reference": "Specimen/bloodSample"
                                },
                                "valueString": "3.3 g/dL",
                                "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                                "issued": "2026-01-02T14:46:00.000Z"
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "https://crlcorp.com",
                                            "code": "T226",
                                            "display": "VITAMIN B-12"
                                        }
                                    ],
                                    "text": "VITAMIN B-12"
                                },
                                "specimen": {
                                    "reference": "Specimen/bloodSample"
                                },
                                "valueString": "311 pg/mL",
                                "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                                "issued": "2026-01-02T14:46:00.000Z"
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "https://crlcorp.com",
                                            "code": "T791",
                                            "display": "VITAMIN D 25 HYDROXY"
                                        }
                                    ],
                                    "text": "VITAMIN D 25 HYDROXY"
                                },
                                "specimen": {
                                    "reference": "Specimen/bloodSample"
                                },
                                "valueString": "88.20 ng/mL",
                                "interpretation": [
                                    {
                                        "coding": [
                                            {
                                                "system": "https://snomed.org/use-snomed-ct",
                                                "code": "75540009",
                                                "display": "High"
                                            },
                                            {
                                                "system": "https://terminology.hl7.org/5.1.0/CodeSystem-v3-ObservationInterpretation.html",
                                                "code": "H",
                                                "display": "High"
                                            }
                                        ],
                                        "text": "HIGH"
                                    }
                                ],
                                "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                                "issued": "2026-01-02T14:46:00.000Z"
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "https://crlcorp.com",
                                            "code": "T049",
                                            "display": "HEMOGLOBIN A1C"
                                        }
                                    ],
                                    "text": "HEMOGLOBIN A1C"
                                },
                                "specimen": {
                                    "reference": "Specimen/bloodSample"
                                },
                                "valueString": "5.3 %",
                                "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                                "issued": "2026-01-02T14:46:00.000Z"
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "https://crlcorp.com",
                                            "code": "T514",
                                            "display": "HIGH DENSITY LIPOPROTEIN(HDL)"
                                        }
                                    ],
                                    "text": "HIGH DENSITY LIPOPROTEIN(HDL)"
                                },
                                "specimen": {
                                    "reference": "Specimen/bloodSample"
                                },
                                "valueString": "74 mg/dL",
                                "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                                "issued": "2026-01-02T14:46:00.000Z"
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "https://crlcorp.com",
                                            "code": "T516",
                                            "display": "TRIGLYCERIDES"
                                        }
                                    ],
                                    "text": "TRIGLYCERIDES"
                                },
                                "specimen": {
                                    "reference": "Specimen/bloodSample"
                                },
                                "valueString": "104 mg/dL",
                                "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                                "issued": "2026-01-02T14:46:00.000Z"
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "https://crlcorp.com",
                                            "code": "T513",
                                            "display": "CHOLESTEROL"
                                        }
                                    ],
                                    "text": "CHOLESTEROL"
                                },
                                "specimen": {
                                    "reference": "Specimen/bloodSample"
                                },
                                "valueString": "190 mg/dL",
                                "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                                "issued": "2026-01-02T14:46:00.000Z"
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "https://crlcorp.com",
                                            "code": "T517",
                                            "display": "VERYLOW DENSITY LIPO. (VLDL)"
                                        }
                                    ],
                                    "text": "VERYLOW DENSITY LIPO. (VLDL)"
                                },
                                "specimen": {
                                    "reference": "Specimen/bloodSample"
                                },
                                "valueString": "20 mg/dL",
                                "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                                "issued": "2026-01-02T14:46:00.000Z"
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "https://crlcorp.com",
                                            "code": "T518",
                                            "display": "LOW DENSITY LIPOPROTEIN (LDL)"
                                        }
                                    ],
                                    "text": "LOW DENSITY LIPOPROTEIN (LDL)"
                                },
                                "specimen": {
                                    "reference": "Specimen/bloodSample"
                                },
                                "valueString": "95 mg/dL",
                                "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                                "issued": "2026-01-02T14:46:00.000Z"
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "https://crlcorp.com",
                                            "code": "K206",
                                            "display": "HS-CRP"
                                        }
                                    ],
                                    "text": "HS-CRP"
                                },
                                "specimen": {
                                    "reference": "Specimen/bloodSample"
                                },
                                "valueString": "0.4 mg/dL",
                                "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                                "issued": "2026-01-02T14:46:00.000Z"
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "DiagnosticReport",
                                "status": "final",
                                "specimen": [
                                    {
                                        "reference": "Specimen/bloodSample"
                                    }
                                ],
                                "presentedForm": [
                                    {
                                        "contentType": "application/PDF",
                                        "title": "Lab Report",
                                        "data": "02-Jan-2026              Clinical Reference Laboratory                     17:56\n                         CLIA #17D0667123, CAP #3021101\n\nBETR HEALTH                  NAME: TEST, DISNEY              SAMPLE ID: 21883916\nDIALA HAMED                  DOB: 11/30/00 (AGE:  25 YRS)    COLLECTED: 01/02/26\n1 GLENWOOD AVE #5            ID: N/S                         RECEIVED:  01/02/26\nRALEIGH, NC 27603            GENDER: MALE                    REPORTED:  01/02/26\n                             SLIP ID: 00000177ED             FAX: N/S\nPH: (919) 961-2302           SPONSOR: 00000177ED\nCOLL. SITE ID: N/S           BRANCH: WELLNESS\n\n                  REASON FOR TESTING:  HEALTH RISK ASSESSMENT\n\nTESTING PERFORMED AT:\nCLINICAL REFERENCE LABORATORY\n8433 QUIVIRA ROAD, LENEXA, KS 66215 (913)492-3652\nSHAWN R. CLINTON, PHD DABCC\nCLIA #17D0667123 CAP #3021101 PFI#4112\n\nALL TESTS PERFORMED ON BLOOD UNLESS OTHERWISE SPECIFIED.\n\nGENERAL COMMENT(S):\n  Tasso Kit Order #11cb5d3a-93f6-41d2-af99-f1105d893caf\n\nCHEMISTRIES                      RESULT / STATUS          CUTOFF/EXPECTED VALUES\n-----------                    -------------------        ----------------------\n  ALBUMIN                           3.3                   3.2-5.5 g/dL\n  VITAMIN B-12                      311                   211-911 pg/mL\n  VITAMIN D 25 HYDROXY            88.20   HIGH\n\n   Interpretive guidelines for Vitamin D (25-Hydroxy):\n   >80 ng/mL ....Potential Toxicity\n   26-80 ng/mL...Optimum Level\n   10-25 ng/mL...Mild to Moderate Deficiency\n   <10 ng/mL.....Severe Deficiency\n\n  HEMOGLOBIN A1C                    5.3\n\n   Normal               Less than 5.7%\n   Prediabetes          5.7% - 6.4%\n   Diabetes             6.5% or higher\n\nCARDIAC PROFILE                  RESULT / STATUS          CUTOFF/EXPECTED VALUES\n---------------                -------------------        ----------------------\n  HIGH DENSITY LIPOPROTEIN(HDL       74                   40-75 mg/dL\n  TRIGLYCERIDES                     104                   10-150 mg/dL\n  CHOLESTEROL                       190                   120-199 mg/dL\n  VERYLOW DENSITY LIPO. (VLDL)       20                   5-40 mg/dL\n  LOW DENSITY LIPOPROTEIN (LDL       95                   50-129 mg/dL\n\n\n                                    Page  1\n\n      Copyright 2026 Clinical Reference Laboratory.  All Rights Reserved.\n           8433 Quivira Road.  Lenexa, Kansas 66215.  (913) 492-3652\n\n                               FCB: CLS.WLZ.WELL\n\\X0C\\\n02-Jan-2026              Clinical Reference Laboratory                     17:56\n                         CLIA #17D0667123, CAP #3021101\n\nBETR HEALTH                  NAME: TEST, DISNEY              SAMPLE ID: 21883916\nDIALA HAMED                  DOB: 11/30/00 (AGE:  25 YRS)    COLLECTED: 01/02/26\n1 GLENWOOD AVE #5            ID: N/S                         RECEIVED:  01/02/26\nRALEIGH, NC 27603            GENDER: MALE                    REPORTED:  01/02/26\n                             SLIP ID: 00000177ED             FAX: N/S\nPH: (919) 961-2302           SPONSOR: 00000177ED\nCOLL. SITE ID: N/S           BRANCH: WELLNESS\n\n                  REASON FOR TESTING:  HEALTH RISK ASSESSMENT\n\nTESTING PERFORMED AT:\nCLINICAL REFERENCE LABORATORY\n8433 QUIVIRA ROAD, LENEXA, KS 66215 (913)492-3652\nSHAWN R. CLINTON, PHD DABCC\nCLIA #17D0667123 CAP #3021101 PFI#4112\n\nALL TESTS PERFORMED ON BLOOD UNLESS OTHERWISE SPECIFIED.\n\nGENERAL COMMENT(S):\n  Tasso Kit Order #11cb5d3a-93f6-41d2-af99-f1105d893caf\n\nSEROLOGY                         RESULT / STATUS          CUTOFF/EXPECTED VALUES\n--------                       -------------------        ----------------------\n  HS-CRP                            0.4                   0.0-0.5 mg/dL\n\n  THE CDC/AHA RECOMMENDS THE FOLLOWING HSCRP CUTOFF POINTS\n  FOR CVD RISK ASSESSMENT:\n  HSCRP LEVEL (MG/DL)  HSCRP LEVEL(MG/L)   RELATIVE RISK\n        <0.1                 <1.0              LOW\n        0.1 - 0.3            1.0 - 3.0         AVERAGE\n        >0.3                 >3.0              HIGH\n\n\n               LAB DIRECTOR: SHAWN R. CLINTON, PHD, DABCC\n\n\n\n               ELECTRONICALLY REVIEWED BY COMPUTER\n\n\n\n\n\n\n\n\n\n\n                                    Page  2\n\n      Copyright 2026 Clinical Reference Laboratory.  All Rights Reserved.\n           8433 Quivira Road.  Lenexa, Kansas 66215.  (913) 492-3652\n\n                               FCB: CLS.WLZ.WELL\n\n                              [  end of report  ]\n"
                                    }
                                ],
                                "code": {}
                            }
                        }
                    ],
                    "meta": {
                        "lastUpdated": "2026-01-03T00:01:58.831Z"
                    },
                    "timestamp": "2026-01-03T00:01:58.831Z"
                },
                "rawResults": {
                    "value": "FHS|^~\\&|Clinical Reference Laboratory|CLS|||202601021756\r\nMSH|^~\\&|Clinical Reference Laboratory|CLS^CRL, 8433 Quivira Road Lenexa, Kansas 66215^L|||202601021756||ORU|1|P|2.3|||NE|NE|US|ASCII|ENG\r\nPID|1|00000177ED|6121883916|N/S|TEST^DISNEY||200011300000|M|||||N/S|N/S|N/S||||N/S|N/S\r\nNTE|1|L|ACCOUNT_CODE_NAMES\\S\\BETR HEALTH\\T\\WELLNESS\\T\\\\T\\\r\nNTE|2|L|TRANSMIT_DATE\\S\\202601021756\r\nNTE|3|L|12J\\S\\TESTING PERFORMED AT:\\.br.\\CLINICAL REFERENCE LABORATORY\\.br.\\8433 QUIVIRA ROAD, LENEXA, KS 66215 (913)492-3652\\.br.\\SHAWN R. CLINTON, PHD DABCC\\.br.\\CLIA #17D0667123 CAP #3021101 PFI#4112\r\nNTE|4|L|I49\\S\\ALL TESTS PERFORMED ON BLOOD UNLESS OTHERWISE SPECIFIED.\r\nNTE|5|L|Tasso Kit Order #11cb5d3a-93f6-41d2-af99-f1105d893caf\r\nNTE|6|L|00000177ED\\S\\CONTAINER ID\r\nPR1|1||Y552^CHD/ALB/A1C/CRP/VITD/VITB12|||D\r\nOBR|1|00000177ED|||||202601021843|||CLS..^N/S^N/S|L|||202601021415||WLZ.WELL||||H\\S\\HEALTH FAIR/WELLNESS|CHEMISTRIES|202601021446||LAB|F||||||HR^HEALTH RISK ASSESSMENT|DIALA HAMED|COMPUTER\r\nOBX|1|SN|T511^ALBUMIN||^3.3|g/dL|3.2-5.5||||F\r\nOBX|2|SN|T226^VITAMIN B-12||^311|pg/mL|211-911||||F\r\nOBX|3|ST|T791^VITAMIN D 25 HYDROXY||HIGH|ng/mL|||||F\r\nOBX|3|SN|T791^VITAMIN D 25 HYDROXY||^88.20|ng/mL|||||F\r\nNTE|1|L|Interpretive guidelines for Vitamin D (25-Hydroxy):\r\nNTE|2|L|>80 ng/mL ....Potential Toxicity\r\nNTE|3|L|26-80 ng/mL...Optimum Level\r\nNTE|4|L|10-25 ng/mL...Mild to Moderate Deficiency\r\nNTE|5|L|<10 ng/mL.....Severe Deficiency\r\nOBX|4|SN|T049^HEMOGLOBIN A1C||^5.3|%|||||F\r\nNTE|1|L|Normal               Less than 5.7%\r\nNTE|2|L|Prediabetes          5.7% - 6.4%\r\nNTE|3|L|Diabetes             6.5% or higher\r\nOBR|2|00000177ED|||||202601021843|||CLS..^N/S^N/S|L|||202601021415||WLZ.WELL||||H\\S\\HEALTH FAIR/WELLNESS|CARDIAC PROFILE|202601021446||LAB|F||||||HR^HEALTH RISK ASSESSMENT|DIALA HAMED|COMPUTER\r\nOBX|5|SN|T514^HIGH DENSITY LIPOPROTEIN(HDL)||^74|mg/dL|40-75||||F\r\nOBX|6|SN|T516^TRIGLYCERIDES||^104|mg/dL|10-150||||F\r\nOBX|7|SN|T513^CHOLESTEROL||^190|mg/dL|120-199||||F\r\nOBX|8|SN|T517^VERYLOW DENSITY LIPO. (VLDL)||^20|mg/dL|5-40||||F\r\nOBX|9|SN|T518^LOW DENSITY LIPOPROTEIN (LDL)||^95|mg/dL|50-129||||F\r\nOBR|3|00000177ED|||||202601021843|||CLS..^N/S^N/S|L|||202601021415||WLZ.WELL||||H\\S\\HEALTH FAIR/WELLNESS|SEROLOGY|202601021446||LAB|F||||||HR^HEALTH RISK ASSESSMENT|DIALA HAMED|COMPUTER\r\nOBX|10|SN|K206^HS-CRP||^0.4|mg/dL|0.0-0.5||||F\r\nPV1|1\r\nDSP|1||02-Jan-2026              Clinical Reference Laboratory                     17:56\r\nDSP|2||                         CLIA #17D0667123, CAP #3021101\r\nDSP|3\r\nDSP|4||BETR HEALTH                  NAME: TEST, DISNEY              SAMPLE ID: 21883916\r\nDSP|5||DIALA HAMED                  DOB: 11/30/00 (AGE:  25 YRS)    COLLECTED: 01/02/26\r\nDSP|6||1 GLENWOOD AVE #5            ID: N/S                         RECEIVED:  01/02/26\r\nDSP|7||RALEIGH, NC 27603            GENDER: MALE                    REPORTED:  01/02/26\r\nDSP|8||                             SLIP ID: 00000177ED             FAX: N/S\r\nDSP|9||PH: (919) 961-2302           SPONSOR: 00000177ED\r\nDSP|10||COLL. SITE ID: N/S           BRANCH: WELLNESS\r\nDSP|11\r\nDSP|12||                  REASON FOR TESTING:  HEALTH RISK ASSESSMENT\r\nDSP|13\r\nDSP|14||TESTING PERFORMED AT:\r\nDSP|15||CLINICAL REFERENCE LABORATORY\r\nDSP|16||8433 QUIVIRA ROAD, LENEXA, KS 66215 (913)492-3652\r\nDSP|17||SHAWN R. CLINTON, PHD DABCC\r\nDSP|18||CLIA #17D0667123 CAP #3021101 PFI#4112\r\nDSP|19\r\nDSP|20||ALL TESTS PERFORMED ON BLOOD UNLESS OTHERWISE SPECIFIED.\r\nDSP|21\r\nDSP|22||GENERAL COMMENT(S):\r\nDSP|23||  Tasso Kit Order #11cb5d3a-93f6-41d2-af99-f1105d893caf\r\nDSP|24\r\nDSP|25||CHEMISTRIES                      RESULT / STATUS          CUTOFF/EXPECTED VALUES\r\nDSP|26||-----------                    -------------------        ----------------------\r\nDSP|27||  ALBUMIN                           3.3                   3.2-5.5 g/dL\r\nDSP|28||  VITAMIN B-12                      311                   211-911 pg/mL\r\nDSP|29||  VITAMIN D 25 HYDROXY            88.20   HIGH\r\nDSP|30\r\nDSP|31||   Interpretive guidelines for Vitamin D (25-Hydroxy):\r\nDSP|32||   >80 ng/mL ....Potential Toxicity\r\nDSP|33||   26-80 ng/mL...Optimum Level\r\nDSP|34||   10-25 ng/mL...Mild to Moderate Deficiency\r\nDSP|35||   <10 ng/mL.....Severe Deficiency\r\nDSP|36\r\nDSP|37||  HEMOGLOBIN A1C                    5.3\r\nDSP|38\r\nDSP|39||   Normal               Less than 5.7%\r\nDSP|40||   Prediabetes          5.7% - 6.4%\r\nDSP|41||   Diabetes             6.5% or higher\r\nDSP|42\r\nDSP|43||CARDIAC PROFILE                  RESULT / STATUS          CUTOFF/EXPECTED VALUES\r\nDSP|44||---------------                -------------------        ----------------------\r\nDSP|45||  HIGH DENSITY LIPOPROTEIN(HDL       74                   40-75 mg/dL\r\nDSP|46||  TRIGLYCERIDES                     104                   10-150 mg/dL\r\nDSP|47||  CHOLESTEROL                       190                   120-199 mg/dL\r\nDSP|48||  VERYLOW DENSITY LIPO. (VLDL)       20                   5-40 mg/dL\r\nDSP|49||  LOW DENSITY LIPOPROTEIN (LDL       95                   50-129 mg/dL\r\nDSP|50\r\nDSP|51\r\nDSP|52||                                    Page  1\r\nDSP|53\r\nDSP|54||      Copyright 2026 Clinical Reference Laboratory.  All Rights Reserved.\r\nDSP|55||           8433 Quivira Road.  Lenexa, Kansas 66215.  (913) 492-3652\r\nDSP|56\r\nDSP|57||                               FCB: CLS.WLZ.WELL\r\nDSP|58||\\X0C\\\r\nDSP|59||02-Jan-2026              Clinical Reference Laboratory                     17:56\r\nDSP|60||                         CLIA #17D0667123, CAP #3021101\r\nDSP|61\r\nDSP|62||BETR HEALTH                  NAME: TEST, DISNEY              SAMPLE ID: 21883916\r\nDSP|63||DIALA HAMED                  DOB: 11/30/00 (AGE:  25 YRS)    COLLECTED: 01/02/26\r\nDSP|64||1 GLENWOOD AVE #5            ID: N/S                         RECEIVED:  01/02/26\r\nDSP|65||RALEIGH, NC 27603            GENDER: MALE                    REPORTED:  01/02/26\r\nDSP|66||                             SLIP ID: 00000177ED             FAX: N/S\r\nDSP|67||PH: (919) 961-2302           SPONSOR: 00000177ED\r\nDSP|68||COLL. SITE ID: N/S           BRANCH: WELLNESS\r\nDSP|69\r\nDSP|70||                  REASON FOR TESTING:  HEALTH RISK ASSESSMENT\r\nDSP|71\r\nDSP|72||TESTING PERFORMED AT:\r\nDSP|73||CLINICAL REFERENCE LABORATORY\r\nDSP|74||8433 QUIVIRA ROAD, LENEXA, KS 66215 (913)492-3652\r\nDSP|75||SHAWN R. CLINTON, PHD DABCC\r\nDSP|76||CLIA #17D0667123 CAP #3021101 PFI#4112\r\nDSP|77\r\nDSP|78||ALL TESTS PERFORMED ON BLOOD UNLESS OTHERWISE SPECIFIED.\r\nDSP|79\r\nDSP|80||GENERAL COMMENT(S):\r\nDSP|81||  Tasso Kit Order #11cb5d3a-93f6-41d2-af99-f1105d893caf\r\nDSP|82\r\nDSP|83||SEROLOGY                         RESULT / STATUS          CUTOFF/EXPECTED VALUES\r\nDSP|84||--------                       -------------------        ----------------------\r\nDSP|85||  HS-CRP                            0.4                   0.0-0.5 mg/dL\r\nDSP|86\r\nDSP|87||  THE CDC/AHA RECOMMENDS THE FOLLOWING HSCRP CUTOFF POINTS\r\nDSP|88||  FOR CVD RISK ASSESSMENT:\r\nDSP|89||  HSCRP LEVEL (MG/DL)  HSCRP LEVEL(MG/L)   RELATIVE RISK\r\nDSP|90||        <0.1                 <1.0              LOW\r\nDSP|91||        0.1 - 0.3            1.0 - 3.0         AVERAGE\r\nDSP|92||        >0.3                 >3.0              HIGH\r\nDSP|93\r\nDSP|94\r\nDSP|95||               LAB DIRECTOR: SHAWN R. CLINTON, PHD, DABCC\r\nDSP|96\r\nDSP|97\r\nDSP|98\r\nDSP|99||               ELECTRONICALLY REVIEWED BY COMPUTER\r\nDSP|100\r\nDSP|101\r\nDSP|102\r\nDSP|103\r\nDSP|104\r\nDSP|105\r\nDSP|106\r\nDSP|107\r\nDSP|108\r\nDSP|109\r\nDSP|110||                                    Page  2\r\nDSP|111\r\nDSP|112||      Copyright 2026 Clinical Reference Laboratory.  All Rights Reserved.\r\nDSP|113||           8433 Quivira Road.  Lenexa, Kansas 66215.  (913) 492-3652\r\nDSP|114\r\nDSP|115||                               FCB: CLS.WLZ.WELL\r\nDSP|116\r\nDSP|117||                              [  end of report  ]\r\nDSP|118\r\nFTS|1|CRL HL7 Format Implementation\r\n"
                }
            }
        ]
    }
}


DESCRIBE A SINGLE TEST RESULT

describe a single test result



{
    "success": true,
    "message": null,
    "data": {
        "id": "1c80676f-5740-4f1e-a58d-64a425a6113f",
        "patientId": "4d625b8f-4731-4273-a543-b2e840ae9339",
        "orderId": "11cb5d3a-93f6-41d2-af99-f1105d893caf",
        "createdAt": "2026-01-03T00:01:58.831Z",
        "updatedAt": null,
        "renderedResults": {
            "resourceType": "Bundle",
            "identifier": {
                "system": "urn:ietf:rfc:3986",
                "value": "urn:uuid:1c80676f-5740-4f1e-a58d-64a425a6113f"
            },
            "type": "collection",
            "entry": [
                {
                    "resource": {
                        "resourceType": "Specimen",
                        "id": "bloodSample",
                        "receivedTime": "2026-01-02T14:15:00.000Z",
                        "collection": {
                            "collectedDateTime": "2026-01-02T18:43:00.000Z"
                        }
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://crlcorp.com",
                                    "code": "T511",
                                    "display": "ALBUMIN"
                                }
                            ],
                            "text": "ALBUMIN"
                        },
                        "specimen": {
                            "reference": "Specimen/bloodSample"
                        },
                        "valueString": "3.3 g/dL",
                        "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                        "issued": "2026-01-02T14:46:00.000Z"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://crlcorp.com",
                                    "code": "T226",
                                    "display": "VITAMIN B-12"
                                }
                            ],
                            "text": "VITAMIN B-12"
                        },
                        "specimen": {
                            "reference": "Specimen/bloodSample"
                        },
                        "valueString": "311 pg/mL",
                        "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                        "issued": "2026-01-02T14:46:00.000Z"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://crlcorp.com",
                                    "code": "T791",
                                    "display": "VITAMIN D 25 HYDROXY"
                                }
                            ],
                            "text": "VITAMIN D 25 HYDROXY"
                        },
                        "specimen": {
                            "reference": "Specimen/bloodSample"
                        },
                        "valueString": "88.20 ng/mL",
                        "interpretation": [
                            {
                                "coding": [
                                    {
                                        "system": "https://snomed.org/use-snomed-ct",
                                        "code": "75540009",
                                        "display": "High"
                                    },
                                    {
                                        "system": "https://terminology.hl7.org/5.1.0/CodeSystem-v3-ObservationInterpretation.html",
                                        "code": "H",
                                        "display": "High"
                                    }
                                ],
                                "text": "HIGH"
                            }
                        ],
                        "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                        "issued": "2026-01-02T14:46:00.000Z"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://crlcorp.com",
                                    "code": "T049",
                                    "display": "HEMOGLOBIN A1C"
                                }
                            ],
                            "text": "HEMOGLOBIN A1C"
                        },
                        "specimen": {
                            "reference": "Specimen/bloodSample"
                        },
                        "valueString": "5.3 %",
                        "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                        "issued": "2026-01-02T14:46:00.000Z"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://crlcorp.com",
                                    "code": "T514",
                                    "display": "HIGH DENSITY LIPOPROTEIN(HDL)"
                                }
                            ],
                            "text": "HIGH DENSITY LIPOPROTEIN(HDL)"
                        },
                        "specimen": {
                            "reference": "Specimen/bloodSample"
                        },
                        "valueString": "74 mg/dL",
                        "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                        "issued": "2026-01-02T14:46:00.000Z"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://crlcorp.com",
                                    "code": "T516",
                                    "display": "TRIGLYCERIDES"
                                }
                            ],
                            "text": "TRIGLYCERIDES"
                        },
                        "specimen": {
                            "reference": "Specimen/bloodSample"
                        },
                        "valueString": "104 mg/dL",
                        "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                        "issued": "2026-01-02T14:46:00.000Z"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://crlcorp.com",
                                    "code": "T513",
                                    "display": "CHOLESTEROL"
                                }
                            ],
                            "text": "CHOLESTEROL"
                        },
                        "specimen": {
                            "reference": "Specimen/bloodSample"
                        },
                        "valueString": "190 mg/dL",
                        "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                        "issued": "2026-01-02T14:46:00.000Z"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://crlcorp.com",
                                    "code": "T517",
                                    "display": "VERYLOW DENSITY LIPO. (VLDL)"
                                }
                            ],
                            "text": "VERYLOW DENSITY LIPO. (VLDL)"
                        },
                        "specimen": {
                            "reference": "Specimen/bloodSample"
                        },
                        "valueString": "20 mg/dL",
                        "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                        "issued": "2026-01-02T14:46:00.000Z"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://crlcorp.com",
                                    "code": "T518",
                                    "display": "LOW DENSITY LIPOPROTEIN (LDL)"
                                }
                            ],
                            "text": "LOW DENSITY LIPOPROTEIN (LDL)"
                        },
                        "specimen": {
                            "reference": "Specimen/bloodSample"
                        },
                        "valueString": "95 mg/dL",
                        "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                        "issued": "2026-01-02T14:46:00.000Z"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {
                            "coding": [
                                {
                                    "system": "https://crlcorp.com",
                                    "code": "K206",
                                    "display": "HS-CRP"
                                }
                            ],
                            "text": "HS-CRP"
                        },
                        "specimen": {
                            "reference": "Specimen/bloodSample"
                        },
                        "valueString": "0.4 mg/dL",
                        "effectiveDateTime": "2026-01-02T18:43:00.000Z",
                        "issued": "2026-01-02T14:46:00.000Z"
                    }
                },
                {
                    "resource": {
                        "resourceType": "DiagnosticReport",
                        "status": "final",
                        "specimen": [
                            {
                                "reference": "Specimen/bloodSample"
                            }
                        ],
                        "presentedForm": [
                            {
                                "contentType": "application/PDF",
                                "title": "Lab Report",
                                "data": "02-Jan-2026              Clinical Reference Laboratory                     17:56\n                         CLIA #17D0667123, CAP #3021101\n\nBETR HEALTH                  NAME: TEST, DISNEY              SAMPLE ID: 21883916\nDIALA HAMED                  DOB: 11/30/00 (AGE:  25 YRS)    COLLECTED: 01/02/26\n1 GLENWOOD AVE #5            ID: N/S                         RECEIVED:  01/02/26\nRALEIGH, NC 27603            GENDER: MALE                    REPORTED:  01/02/26\n                             SLIP ID: 00000177ED             FAX: N/S\nPH: (919) 961-2302           SPONSOR: 00000177ED\nCOLL. SITE ID: N/S           BRANCH: WELLNESS\n\n                  REASON FOR TESTING:  HEALTH RISK ASSESSMENT\n\nTESTING PERFORMED AT:\nCLINICAL REFERENCE LABORATORY\n8433 QUIVIRA ROAD, LENEXA, KS 66215 (913)492-3652\nSHAWN R. CLINTON, PHD DABCC\nCLIA #17D0667123 CAP #3021101 PFI#4112\n\nALL TESTS PERFORMED ON BLOOD UNLESS OTHERWISE SPECIFIED.\n\nGENERAL COMMENT(S):\n  Tasso Kit Order #11cb5d3a-93f6-41d2-af99-f1105d893caf\n\nCHEMISTRIES                      RESULT / STATUS          CUTOFF/EXPECTED VALUES\n-----------                    -------------------        ----------------------\n  ALBUMIN                           3.3                   3.2-5.5 g/dL\n  VITAMIN B-12                      311                   211-911 pg/mL\n  VITAMIN D 25 HYDROXY            88.20   HIGH\n\n   Interpretive guidelines for Vitamin D (25-Hydroxy):\n   >80 ng/mL ....Potential Toxicity\n   26-80 ng/mL...Optimum Level\n   10-25 ng/mL...Mild to Moderate Deficiency\n   <10 ng/mL.....Severe Deficiency\n\n  HEMOGLOBIN A1C                    5.3\n\n   Normal               Less than 5.7%\n   Prediabetes          5.7% - 6.4%\n   Diabetes             6.5% or higher\n\nCARDIAC PROFILE                  RESULT / STATUS          CUTOFF/EXPECTED VALUES\n---------------                -------------------        ----------------------\n  HIGH DENSITY LIPOPROTEIN(HDL       74                   40-75 mg/dL\n  TRIGLYCERIDES                     104                   10-150 mg/dL\n  CHOLESTEROL                       190                   120-199 mg/dL\n  VERYLOW DENSITY LIPO. (VLDL)       20                   5-40 mg/dL\n  LOW DENSITY LIPOPROTEIN (LDL       95                   50-129 mg/dL\n\n\n                                    Page  1\n\n      Copyright 2026 Clinical Reference Laboratory.  All Rights Reserved.\n           8433 Quivira Road.  Lenexa, Kansas 66215.  (913) 492-3652\n\n                               FCB: CLS.WLZ.WELL\n\\X0C\\\n02-Jan-2026              Clinical Reference Laboratory                     17:56\n                         CLIA #17D0667123, CAP #3021101\n\nBETR HEALTH                  NAME: TEST, DISNEY              SAMPLE ID: 21883916\nDIALA HAMED                  DOB: 11/30/00 (AGE:  25 YRS)    COLLECTED: 01/02/26\n1 GLENWOOD AVE #5            ID: N/S                         RECEIVED:  01/02/26\nRALEIGH, NC 27603            GENDER: MALE                    REPORTED:  01/02/26\n                             SLIP ID: 00000177ED             FAX: N/S\nPH: (919) 961-2302           SPONSOR: 00000177ED\nCOLL. SITE ID: N/S           BRANCH: WELLNESS\n\n                  REASON FOR TESTING:  HEALTH RISK ASSESSMENT\n\nTESTING PERFORMED AT:\nCLINICAL REFERENCE LABORATORY\n8433 QUIVIRA ROAD, LENEXA, KS 66215 (913)492-3652\nSHAWN R. CLINTON, PHD DABCC\nCLIA #17D0667123 CAP #3021101 PFI#4112\n\nALL TESTS PERFORMED ON BLOOD UNLESS OTHERWISE SPECIFIED.\n\nGENERAL COMMENT(S):\n  Tasso Kit Order #11cb5d3a-93f6-41d2-af99-f1105d893caf\n\nSEROLOGY                         RESULT / STATUS          CUTOFF/EXPECTED VALUES\n--------                       -------------------        ----------------------\n  HS-CRP                            0.4                   0.0-0.5 mg/dL\n\n  THE CDC/AHA RECOMMENDS THE FOLLOWING HSCRP CUTOFF POINTS\n  FOR CVD RISK ASSESSMENT:\n  HSCRP LEVEL (MG/DL)  HSCRP LEVEL(MG/L)   RELATIVE RISK\n        <0.1                 <1.0              LOW\n        0.1 - 0.3            1.0 - 3.0         AVERAGE\n        >0.3                 >3.0              HIGH\n\n\n               LAB DIRECTOR: SHAWN R. CLINTON, PHD, DABCC\n\n\n\n               ELECTRONICALLY REVIEWED BY COMPUTER\n\n\n\n\n\n\n\n\n\n\n                                    Page  2\n\n      Copyright 2026 Clinical Reference Laboratory.  All Rights Reserved.\n           8433 Quivira Road.  Lenexa, Kansas 66215.  (913) 492-3652\n\n                               FCB: CLS.WLZ.WELL\n\n                              [  end of report  ]\n"
                            }
                        ],
                        "code": {}
                    }
                }
            ],
            "meta": {
                "lastUpdated": "2026-01-03T00:01:58.831Z"
            },
            "timestamp": "2026-01-03T00:01:58.831Z"
        },
        "rawResults": {
            "value": "FHS|^~\\&|Clinical Reference Laboratory|CLS|||202601021756\r\nMSH|^~\\&|Clinical Reference Laboratory|CLS^CRL, 8433 Quivira Road Lenexa, Kansas 66215^L|||202601021756||ORU|1|P|2.3|||NE|NE|US|ASCII|ENG\r\nPID|1|00000177ED|6121883916|N/S|TEST^DISNEY||200011300000|M|||||N/S|N/S|N/S||||N/S|N/S\r\nNTE|1|L|ACCOUNT_CODE_NAMES\\S\\BETR HEALTH\\T\\WELLNESS\\T\\\\T\\\r\nNTE|2|L|TRANSMIT_DATE\\S\\202601021756\r\nNTE|3|L|12J\\S\\TESTING PERFORMED AT:\\.br.\\CLINICAL REFERENCE LABORATORY\\.br.\\8433 QUIVIRA ROAD, LENEXA, KS 66215 (913)492-3652\\.br.\\SHAWN R. CLINTON, PHD DABCC\\.br.\\CLIA #17D0667123 CAP #3021101 PFI#4112\r\nNTE|4|L|I49\\S\\ALL TESTS PERFORMED ON BLOOD UNLESS OTHERWISE SPECIFIED.\r\nNTE|5|L|Tasso Kit Order #11cb5d3a-93f6-41d2-af99-f1105d893caf\r\nNTE|6|L|00000177ED\\S\\CONTAINER ID\r\nPR1|1||Y552^CHD/ALB/A1C/CRP/VITD/VITB12|||D\r\nOBR|1|00000177ED|||||202601021843|||CLS..^N/S^N/S|L|||202601021415||WLZ.WELL||||H\\S\\HEALTH FAIR/WELLNESS|CHEMISTRIES|202601021446||LAB|F||||||HR^HEALTH RISK ASSESSMENT|DIALA HAMED|COMPUTER\r\nOBX|1|SN|T511^ALBUMIN||^3.3|g/dL|3.2-5.5||||F\r\nOBX|2|SN|T226^VITAMIN B-12||^311|pg/mL|211-911||||F\r\nOBX|3|ST|T791^VITAMIN D 25 HYDROXY||HIGH|ng/mL|||||F\r\nOBX|3|SN|T791^VITAMIN D 25 HYDROXY||^88.20|ng/mL|||||F\r\nNTE|1|L|Interpretive guidelines for Vitamin D (25-Hydroxy):\r\nNTE|2|L|>80 ng/mL ....Potential Toxicity\r\nNTE|3|L|26-80 ng/mL...Optimum Level\r\nNTE|4|L|10-25 ng/mL...Mild to Moderate Deficiency\r\nNTE|5|L|<10 ng/mL.....Severe Deficiency\r\nOBX|4|SN|T049^HEMOGLOBIN A1C||^5.3|%|||||F\r\nNTE|1|L|Normal               Less than 5.7%\r\nNTE|2|L|Prediabetes          5.7% - 6.4%\r\nNTE|3|L|Diabetes             6.5% or higher\r\nOBR|2|00000177ED|||||202601021843|||CLS..^N/S^N/S|L|||202601021415||WLZ.WELL||||H\\S\\HEALTH FAIR/WELLNESS|CARDIAC PROFILE|202601021446||LAB|F||||||HR^HEALTH RISK ASSESSMENT|DIALA HAMED|COMPUTER\r\nOBX|5|SN|T514^HIGH DENSITY LIPOPROTEIN(HDL)||^74|mg/dL|40-75||||F\r\nOBX|6|SN|T516^TRIGLYCERIDES||^104|mg/dL|10-150||||F\r\nOBX|7|SN|T513^CHOLESTEROL||^190|mg/dL|120-199||||F\r\nOBX|8|SN|T517^VERYLOW DENSITY LIPO. (VLDL)||^20|mg/dL|5-40||||F\r\nOBX|9|SN|T518^LOW DENSITY LIPOPROTEIN (LDL)||^95|mg/dL|50-129||||F\r\nOBR|3|00000177ED|||||202601021843|||CLS..^N/S^N/S|L|||202601021415||WLZ.WELL||||H\\S\\HEALTH FAIR/WELLNESS|SEROLOGY|202601021446||LAB|F||||||HR^HEALTH RISK ASSESSMENT|DIALA HAMED|COMPUTER\r\nOBX|10|SN|K206^HS-CRP||^0.4|mg/dL|0.0-0.5||||F\r\nPV1|1\r\nDSP|1||02-Jan-2026              Clinical Reference Laboratory                     17:56\r\nDSP|2||                         CLIA #17D0667123, CAP #3021101\r\nDSP|3\r\nDSP|4||BETR HEALTH                  NAME: TEST, DISNEY              SAMPLE ID: 21883916\r\nDSP|5||DIALA HAMED                  DOB: 11/30/00 (AGE:  25 YRS)    COLLECTED: 01/02/26\r\nDSP|6||1 GLENWOOD AVE #5            ID: N/S                         RECEIVED:  01/02/26\r\nDSP|7||RALEIGH, NC 27603            GENDER: MALE                    REPORTED:  01/02/26\r\nDSP|8||                             SLIP ID: 00000177ED             FAX: N/S\r\nDSP|9||PH: (919) 961-2302           SPONSOR: 00000177ED\r\nDSP|10||COLL. SITE ID: N/S           BRANCH: WELLNESS\r\nDSP|11\r\nDSP|12||                  REASON FOR TESTING:  HEALTH RISK ASSESSMENT\r\nDSP|13\r\nDSP|14||TESTING PERFORMED AT:\r\nDSP|15||CLINICAL REFERENCE LABORATORY\r\nDSP|16||8433 QUIVIRA ROAD, LENEXA, KS 66215 (913)492-3652\r\nDSP|17||SHAWN R. CLINTON, PHD DABCC\r\nDSP|18||CLIA #17D0667123 CAP #3021101 PFI#4112\r\nDSP|19\r\nDSP|20||ALL TESTS PERFORMED ON BLOOD UNLESS OTHERWISE SPECIFIED.\r\nDSP|21\r\nDSP|22||GENERAL COMMENT(S):\r\nDSP|23||  Tasso Kit Order #11cb5d3a-93f6-41d2-af99-f1105d893caf\r\nDSP|24\r\nDSP|25||CHEMISTRIES                      RESULT / STATUS          CUTOFF/EXPECTED VALUES\r\nDSP|26||-----------                    -------------------        ----------------------\r\nDSP|27||  ALBUMIN                           3.3                   3.2-5.5 g/dL\r\nDSP|28||  VITAMIN B-12                      311                   211-911 pg/mL\r\nDSP|29||  VITAMIN D 25 HYDROXY            88.20   HIGH\r\nDSP|30\r\nDSP|31||   Interpretive guidelines for Vitamin D (25-Hydroxy):\r\nDSP|32||   >80 ng/mL ....Potential Toxicity\r\nDSP|33||   26-80 ng/mL...Optimum Level\r\nDSP|34||   10-25 ng/mL...Mild to Moderate Deficiency\r\nDSP|35||   <10 ng/mL.....Severe Deficiency\r\nDSP|36\r\nDSP|37||  HEMOGLOBIN A1C                    5.3\r\nDSP|38\r\nDSP|39||   Normal               Less than 5.7%\r\nDSP|40||   Prediabetes          5.7% - 6.4%\r\nDSP|41||   Diabetes             6.5% or higher\r\nDSP|42\r\nDSP|43||CARDIAC PROFILE                  RESULT / STATUS          CUTOFF/EXPECTED VALUES\r\nDSP|44||---------------                -------------------        ----------------------\r\nDSP|45||  HIGH DENSITY LIPOPROTEIN(HDL       74                   40-75 mg/dL\r\nDSP|46||  TRIGLYCERIDES                     104                   10-150 mg/dL\r\nDSP|47||  CHOLESTEROL                       190                   120-199 mg/dL\r\nDSP|48||  VERYLOW DENSITY LIPO. (VLDL)       20                   5-40 mg/dL\r\nDSP|49||  LOW DENSITY LIPOPROTEIN (LDL       95                   50-129 mg/dL\r\nDSP|50\r\nDSP|51\r\nDSP|52||                                    Page  1\r\nDSP|53\r\nDSP|54||      Copyright 2026 Clinical Reference Laboratory.  All Rights Reserved.\r\nDSP|55||           8433 Quivira Road.  Lenexa, Kansas 66215.  (913) 492-3652\r\nDSP|56\r\nDSP|57||                               FCB: CLS.WLZ.WELL\r\nDSP|58||\\X0C\\\r\nDSP|59||02-Jan-2026              Clinical Reference Laboratory                     17:56\r\nDSP|60||                         CLIA #17D0667123, CAP #3021101\r\nDSP|61\r\nDSP|62||BETR HEALTH                  NAME: TEST, DISNEY              SAMPLE ID: 21883916\r\nDSP|63||DIALA HAMED                  DOB: 11/30/00 (AGE:  25 YRS)    COLLECTED: 01/02/26\r\nDSP|64||1 GLENWOOD AVE #5            ID: N/S                         RECEIVED:  01/02/26\r\nDSP|65||RALEIGH, NC 27603            GENDER: MALE                    REPORTED:  01/02/26\r\nDSP|66||                             SLIP ID: 00000177ED             FAX: N/S\r\nDSP|67||PH: (919) 961-2302           SPONSOR: 00000177ED\r\nDSP|68||COLL. SITE ID: N/S           BRANCH: WELLNESS\r\nDSP|69\r\nDSP|70||                  REASON FOR TESTING:  HEALTH RISK ASSESSMENT\r\nDSP|71\r\nDSP|72||TESTING PERFORMED AT:\r\nDSP|73||CLINICAL REFERENCE LABORATORY\r\nDSP|74||8433 QUIVIRA ROAD, LENEXA, KS 66215 (913)492-3652\r\nDSP|75||SHAWN R. CLINTON, PHD DABCC\r\nDSP|76||CLIA #17D0667123 CAP #3021101 PFI#4112\r\nDSP|77\r\nDSP|78||ALL TESTS PERFORMED ON BLOOD UNLESS OTHERWISE SPECIFIED.\r\nDSP|79\r\nDSP|80||GENERAL COMMENT(S):\r\nDSP|81||  Tasso Kit Order #11cb5d3a-93f6-41d2-af99-f1105d893caf\r\nDSP|82\r\nDSP|83||SEROLOGY                         RESULT / STATUS          CUTOFF/EXPECTED VALUES\r\nDSP|84||--------                       -------------------        ----------------------\r\nDSP|85||  HS-CRP                            0.4                   0.0-0.5 mg/dL\r\nDSP|86\r\nDSP|87||  THE CDC/AHA RECOMMENDS THE FOLLOWING HSCRP CUTOFF POINTS\r\nDSP|88||  FOR CVD RISK ASSESSMENT:\r\nDSP|89||  HSCRP LEVEL (MG/DL)  HSCRP LEVEL(MG/L)   RELATIVE RISK\r\nDSP|90||        <0.1                 <1.0              LOW\r\nDSP|91||        0.1 - 0.3            1.0 - 3.0         AVERAGE\r\nDSP|92||        >0.3                 >3.0              HIGH\r\nDSP|93\r\nDSP|94\r\nDSP|95||               LAB DIRECTOR: SHAWN R. CLINTON, PHD, DABCC\r\nDSP|96\r\nDSP|97\r\nDSP|98\r\nDSP|99||               ELECTRONICALLY REVIEWED BY COMPUTER\r\nDSP|100\r\nDSP|101\r\nDSP|102\r\nDSP|103\r\nDSP|104\r\nDSP|105\r\nDSP|106\r\nDSP|107\r\nDSP|108\r\nDSP|109\r\nDSP|110||                                    Page  2\r\nDSP|111\r\nDSP|112||      Copyright 2026 Clinical Reference Laboratory.  All Rights Reserved.\r\nDSP|113||           8433 Quivira Road.  Lenexa, Kansas 66215.  (913) 492-3652\r\nDSP|114\r\nDSP|115||                               FCB: CLS.WLZ.WELL\r\nDSP|116\r\nDSP|117||                              [  end of report  ]\r\nDSP|118\r\nFTS|1|CRL HL7 Format Implementation\r\n"
        }
    }
}
