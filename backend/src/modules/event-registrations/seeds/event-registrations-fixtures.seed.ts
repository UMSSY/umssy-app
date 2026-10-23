import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

const REGISTRATION_PLANS = [
  {
    eventKey: 'record-01390',
    base: 'monday',
    startMinute: -33960,
    registrations: [
      {
        key: 'record-00468',
        userKey: 'record-01880',
        tokenKey: 'record-02765',
      },
      {
        key: 'record-02336',
        userKey: 'record-02303',
        tokenKey: 'record-00867',
      },
      {
        key: 'record-00027',
        userKey: 'record-01108',
        tokenKey: 'record-00695',
      },
      {
        key: 'record-01536',
        userKey: 'record-00242',
        tokenKey: 'record-02104',
      },
      {
        key: 'record-01552',
        userKey: 'record-02874',
        tokenKey: 'record-00286',
      },
      {
        key: 'record-00793',
        userKey: 'record-02069',
        tokenKey: 'record-03523',
      },
      {
        key: 'record-02141',
        userKey: 'record-00715',
        tokenKey: 'record-00161',
      },
      {
        key: 'record-03216',
        userKey: 'record-01645',
        tokenKey: 'record-02015',
      },
      {
        key: 'record-02108',
        userKey: 'record-00357',
        tokenKey: 'record-01368',
      },
      {
        key: 'record-01745',
        userKey: 'record-00979',
        tokenKey: 'record-01359',
      },
      {
        key: 'record-01266',
        userKey: 'record-03051',
        tokenKey: 'record-01991',
      },
      {
        key: 'record-02399',
        userKey: 'record-01197',
        tokenKey: 'record-02105',
      },
      {
        key: 'record-02837',
        userKey: 'record-02670',
        tokenKey: 'record-02643',
      },
      {
        key: 'record-01924',
        userKey: 'record-02601',
        tokenKey: 'record-00656',
      },
      {
        key: 'record-01908',
        userKey: 'record-03450',
        tokenKey: 'record-00952',
      },
    ],
  },
  {
    eventKey: 'record-03488',
    base: 'monday',
    startMinute: -32520,
    registrations: [
      {
        key: 'record-00347',
        userKey: 'record-00242',
        tokenKey: 'record-01660',
      },
      {
        key: 'record-01132',
        userKey: 'record-02874',
        tokenKey: 'record-02495',
      },
      {
        key: 'record-01306',
        userKey: 'record-02069',
        tokenKey: 'record-00234',
      },
      {
        key: 'record-01630',
        userKey: 'record-00715',
        tokenKey: 'record-01098',
      },
      {
        key: 'record-01950',
        userKey: 'record-01645',
        tokenKey: 'record-02184',
      },
      {
        key: 'record-01884',
        userKey: 'record-00357',
        tokenKey: 'record-01003',
      },
      {
        key: 'record-02119',
        userKey: 'record-00979',
        tokenKey: 'record-00416',
      },
      {
        key: 'record-02038',
        userKey: 'record-03051',
        tokenKey: 'record-02217',
      },
      {
        key: 'record-01617',
        userKey: 'record-01197',
        tokenKey: 'record-01560',
      },
      {
        key: 'record-00126',
        userKey: 'record-02670',
        tokenKey: 'record-02656',
      },
      {
        key: 'record-01193',
        userKey: 'record-02601',
        tokenKey: 'record-03138',
      },
      {
        key: 'record-02677',
        userKey: 'record-03450',
        tokenKey: 'record-00651',
      },
      {
        key: 'record-02095',
        userKey: 'record-03151',
        tokenKey: 'record-02080',
      },
      {
        key: 'record-02767',
        userKey: 'record-03432',
        tokenKey: 'record-01569',
      },
      {
        key: 'record-02310',
        userKey: 'record-02893',
        tokenKey: 'record-00414',
      },
    ],
  },
  {
    eventKey: 'record-03136',
    base: 'monday',
    startMinute: -31080,
    registrations: [
      {
        key: 'record-00947',
        userKey: 'record-00715',
        tokenKey: 'record-01325',
      },
      {
        key: 'record-01095',
        userKey: 'record-01645',
        tokenKey: 'record-02318',
      },
      {
        key: 'record-01500',
        userKey: 'record-00357',
        tokenKey: 'record-00507',
      },
      {
        key: 'record-02226',
        userKey: 'record-00979',
        tokenKey: 'record-00064',
      },
      {
        key: 'record-01508',
        userKey: 'record-03051',
        tokenKey: 'record-00203',
      },
      {
        key: 'record-02244',
        userKey: 'record-01197',
        tokenKey: 'record-02676',
      },
      {
        key: 'record-00780',
        userKey: 'record-02670',
        tokenKey: 'record-02852',
      },
      {
        key: 'record-02655',
        userKey: 'record-02601',
        tokenKey: 'record-02543',
      },
      {
        key: 'record-02858',
        userKey: 'record-03450',
        tokenKey: 'record-02804',
      },
      {
        key: 'record-00340',
        userKey: 'record-03151',
        tokenKey: 'record-00024',
      },
      {
        key: 'record-02416',
        userKey: 'record-03432',
        tokenKey: 'record-03284',
      },
      {
        key: 'record-02337',
        userKey: 'record-02893',
        tokenKey: 'record-00522',
      },
      {
        key: 'record-00705',
        userKey: 'record-02931',
        tokenKey: 'record-01688',
      },
      {
        key: 'record-00316',
        userKey: 'record-00602',
        tokenKey: 'record-03456',
      },
      {
        key: 'record-01837',
        userKey: 'record-02703',
        tokenKey: 'record-02243',
      },
    ],
  },
  {
    eventKey: 'record-00368',
    base: 'monday',
    startMinute: -29640,
    registrations: [
      {
        key: 'record-02824',
        userKey: 'record-00979',
        tokenKey: 'record-02606',
      },
      {
        key: 'record-00009',
        userKey: 'record-03051',
        tokenKey: 'record-03254',
      },
      {
        key: 'record-00636',
        userKey: 'record-01197',
        tokenKey: 'record-00388',
      },
      {
        key: 'record-01088',
        userKey: 'record-02670',
        tokenKey: 'record-01535',
      },
      {
        key: 'record-02397',
        userKey: 'record-02601',
        tokenKey: 'record-02994',
      },
      {
        key: 'record-03390',
        userKey: 'record-03450',
        tokenKey: 'record-01464',
      },
      {
        key: 'record-01241',
        userKey: 'record-03151',
        tokenKey: 'record-01239',
      },
      {
        key: 'record-01816',
        userKey: 'record-03432',
        tokenKey: 'record-00729',
      },
      {
        key: 'record-02331',
        userKey: 'record-02893',
        tokenKey: 'record-00903',
      },
      {
        key: 'record-02470',
        userKey: 'record-02931',
        tokenKey: 'record-02710',
      },
      {
        key: 'record-01116',
        userKey: 'record-00602',
        tokenKey: 'record-01157',
      },
      {
        key: 'record-02153',
        userKey: 'record-02703',
        tokenKey: 'record-02116',
      },
      {
        key: 'record-03516',
        userKey: 'record-00295',
        tokenKey: 'record-03308',
      },
      {
        key: 'record-02236',
        userKey: 'record-00508',
        tokenKey: 'record-00653',
      },
      {
        key: 'record-02616',
        userKey: 'record-02953',
        tokenKey: 'record-02614',
      },
    ],
  },
  {
    eventKey: 'record-00755',
    base: 'monday',
    startMinute: -28200,
    registrations: [
      {
        key: 'record-00798',
        userKey: 'record-02670',
        tokenKey: 'record-02984',
      },
      {
        key: 'record-02102',
        userKey: 'record-02601',
        tokenKey: 'record-00717',
      },
      {
        key: 'record-01219',
        userKey: 'record-03450',
        tokenKey: 'record-01764',
      },
      {
        key: 'record-00623',
        userKey: 'record-03151',
        tokenKey: 'record-00525',
      },
      {
        key: 'record-01614',
        userKey: 'record-03432',
        tokenKey: 'record-00477',
      },
      {
        key: 'record-03280',
        userKey: 'record-02893',
        tokenKey: 'record-02459',
      },
      {
        key: 'record-02545',
        userKey: 'record-02931',
        tokenKey: 'record-02441',
      },
      {
        key: 'record-01005',
        userKey: 'record-00602',
        tokenKey: 'record-00785',
      },
      {
        key: 'record-02330',
        userKey: 'record-02703',
        tokenKey: 'record-03273',
      },
      {
        key: 'record-00249',
        userKey: 'record-00295',
        tokenKey: 'record-02295',
      },
      {
        key: 'record-02439',
        userKey: 'record-00508',
        tokenKey: 'record-00686',
      },
      {
        key: 'record-01242',
        userKey: 'record-02953',
        tokenKey: 'record-01605',
      },
      {
        key: 'record-02178',
        userKey: 'record-03323',
        tokenKey: 'record-02268',
      },
      {
        key: 'record-01156',
        userKey: 'record-02750',
        tokenKey: 'record-02856',
      },
      {
        key: 'record-03496',
        userKey: 'record-00191',
        tokenKey: 'record-02803',
      },
    ],
  },
  {
    eventKey: 'record-00666',
    base: 'monday',
    startMinute: -26760,
    registrations: [
      {
        key: 'record-02285',
        userKey: 'record-03151',
        tokenKey: 'record-01969',
      },
      {
        key: 'record-02103',
        userKey: 'record-03432',
        tokenKey: 'record-00441',
      },
      {
        key: 'record-03425',
        userKey: 'record-02893',
        tokenKey: 'record-01965',
      },
      {
        key: 'record-01018',
        userKey: 'record-02931',
        tokenKey: 'record-00456',
      },
      {
        key: 'record-00776',
        userKey: 'record-00602',
        tokenKey: 'record-00177',
      },
      {
        key: 'record-01089',
        userKey: 'record-02703',
        tokenKey: 'record-02275',
      },
      {
        key: 'record-01557',
        userKey: 'record-00295',
        tokenKey: 'record-03002',
      },
      {
        key: 'record-02165',
        userKey: 'record-00508',
        tokenKey: 'record-03263',
      },
      {
        key: 'record-02456',
        userKey: 'record-02953',
        tokenKey: 'record-00730',
      },
      {
        key: 'record-01416',
        userKey: 'record-03323',
        tokenKey: 'record-02190',
      },
      {
        key: 'record-01117',
        userKey: 'record-02750',
        tokenKey: 'record-00370',
      },
      {
        key: 'record-03394',
        userKey: 'record-00191',
        tokenKey: 'record-03200',
      },
      {
        key: 'record-03047',
        userKey: 'record-03502',
        tokenKey: 'record-02258',
      },
      {
        key: 'record-01954',
        userKey: 'record-01962',
        tokenKey: 'record-01770',
      },
      {
        key: 'record-02199',
        userKey: 'record-01403',
        tokenKey: 'record-01848',
      },
    ],
  },
  {
    eventKey: 'record-02361',
    base: 'anchor',
    startMinute: -200,
    registrations: [
      {
        key: 'record-02332',
        userKey: 'record-02931',
        tokenKey: 'record-01275',
      },
      {
        key: 'record-02954',
        userKey: 'record-00602',
        tokenKey: 'record-01619',
      },
      {
        key: 'record-03049',
        userKey: 'record-02703',
        tokenKey: 'record-00551',
      },
      {
        key: 'record-02187',
        userKey: 'record-00295',
        tokenKey: 'record-03108',
      },
      {
        key: 'record-01890',
        userKey: 'record-00508',
        tokenKey: 'record-02586',
      },
      {
        key: 'record-00803',
        userKey: 'record-02953',
        tokenKey: 'record-00582',
      },
      {
        key: 'record-01698',
        userKey: 'record-03323',
        tokenKey: 'record-01792',
      },
      {
        key: 'record-03245',
        userKey: 'record-02750',
        tokenKey: 'record-00427',
      },
      {
        key: 'record-01174',
        userKey: 'record-00191',
        tokenKey: 'record-02827',
      },
      {
        key: 'record-01898',
        userKey: 'record-03502',
        tokenKey: 'record-03145',
      },
      {
        key: 'record-02384',
        userKey: 'record-01962',
        tokenKey: 'record-02049',
      },
      {
        key: 'record-03398',
        userKey: 'record-01403',
        tokenKey: 'record-01808',
      },
      {
        key: 'record-02876',
        userKey: 'record-00241',
        tokenKey: 'record-01958',
      },
      {
        key: 'record-00559',
        userKey: 'record-00283',
        tokenKey: 'record-01919',
      },
      {
        key: 'record-00185',
        userKey: 'record-00412',
        tokenKey: 'record-01109',
      },
    ],
  },
  {
    eventKey: 'record-02403',
    base: 'anchor',
    startMinute: -200,
    registrations: [
      {
        key: 'record-01249',
        userKey: 'record-00295',
        tokenKey: 'record-01065',
      },
      {
        key: 'record-00841',
        userKey: 'record-00508',
        tokenKey: 'record-02486',
      },
      {
        key: 'record-02851',
        userKey: 'record-02953',
        tokenKey: 'record-02754',
      },
      {
        key: 'record-01313',
        userKey: 'record-03323',
        tokenKey: 'record-00821',
      },
      {
        key: 'record-03525',
        userKey: 'record-02750',
        tokenKey: 'record-00467',
      },
      {
        key: 'record-01430',
        userKey: 'record-00191',
        tokenKey: 'record-00701',
      },
      {
        key: 'record-03349',
        userKey: 'record-03502',
        tokenKey: 'record-03211',
      },
      {
        key: 'record-01708',
        userKey: 'record-01962',
        tokenKey: 'record-00948',
      },
      {
        key: 'record-01414',
        userKey: 'record-01403',
        tokenKey: 'record-00319',
      },
      {
        key: 'record-00001',
        userKey: 'record-00241',
        tokenKey: 'record-01055',
      },
      {
        key: 'record-02468',
        userKey: 'record-00283',
        tokenKey: 'record-03382',
      },
      {
        key: 'record-02428',
        userKey: 'record-00412',
        tokenKey: 'record-01171',
      },
      {
        key: 'record-03028',
        userKey: 'record-00122',
        tokenKey: 'record-00700',
      },
      {
        key: 'record-00186',
        userKey: 'record-02093',
        tokenKey: 'record-03183',
      },
      {
        key: 'record-03227',
        userKey: 'record-01983',
        tokenKey: 'record-02201',
      },
    ],
  },
  {
    eventKey: 'record-01869',
    base: 'anchor',
    startMinute: -200,
    registrations: [
      {
        key: 'record-01784',
        userKey: 'record-03323',
        tokenKey: 'record-02987',
      },
      {
        key: 'record-00462',
        userKey: 'record-02750',
        tokenKey: 'record-02396',
      },
      {
        key: 'record-01576',
        userKey: 'record-00191',
        tokenKey: 'record-00969',
      },
      {
        key: 'record-01410',
        userKey: 'record-03502',
        tokenKey: 'record-01139',
      },
      {
        key: 'record-02411',
        userKey: 'record-01962',
        tokenKey: 'record-01845',
      },
      {
        key: 'record-00204',
        userKey: 'record-01403',
        tokenKey: 'record-02663',
      },
      {
        key: 'record-03025',
        userKey: 'record-00241',
        tokenKey: 'record-02512',
      },
      {
        key: 'record-02205',
        userKey: 'record-00283',
        tokenKey: 'record-02989',
      },
      {
        key: 'record-01694',
        userKey: 'record-00412',
        tokenKey: 'record-01879',
      },
      {
        key: 'record-02171',
        userKey: 'record-00122',
        tokenKey: 'record-02735',
      },
      {
        key: 'record-01293',
        userKey: 'record-02093',
        tokenKey: 'record-01305',
      },
      {
        key: 'record-00048',
        userKey: 'record-01983',
        tokenKey: 'record-00387',
      },
      {
        key: 'record-02367',
        userKey: 'record-02511',
        tokenKey: 'record-00217',
      },
      {
        key: 'record-03493',
        userKey: 'record-00524',
        tokenKey: 'record-03192',
      },
      {
        key: 'record-00699',
        userKey: 'record-00404',
        tokenKey: 'record-02311',
      },
    ],
  },
  {
    eventKey: 'record-01453',
    base: 'anchor',
    startMinute: -200,
    registrations: [
      {
        key: 'record-01801',
        userKey: 'record-03502',
        tokenKey: 'record-02611',
      },
      {
        key: 'record-01216',
        userKey: 'record-01962',
        tokenKey: 'record-01531',
      },
      {
        key: 'record-03504',
        userKey: 'record-01403',
        tokenKey: 'record-03521',
      },
      {
        key: 'record-02370',
        userKey: 'record-00241',
        tokenKey: 'record-00434',
      },
      {
        key: 'record-00215',
        userKey: 'record-00283',
        tokenKey: 'record-01360',
      },
      {
        key: 'record-02590',
        userKey: 'record-00412',
        tokenKey: 'record-00720',
      },
      {
        key: 'record-03152',
        userKey: 'record-00122',
        tokenKey: 'record-02747',
      },
      {
        key: 'record-03526',
        userKey: 'record-02093',
        tokenKey: 'record-01017',
      },
      {
        key: 'record-03379',
        userKey: 'record-01983',
        tokenKey: 'record-02228',
      },
      {
        key: 'record-02602',
        userKey: 'record-02511',
        tokenKey: 'record-00049',
      },
      {
        key: 'record-02623',
        userKey: 'record-00524',
        tokenKey: 'record-01631',
      },
      {
        key: 'record-03276',
        userKey: 'record-00404',
        tokenKey: 'record-01280',
      },
      {
        key: 'record-02525',
        userKey: 'record-01608',
        tokenKey: 'record-03375',
      },
      {
        key: 'record-00496',
        userKey: 'record-03381',
        tokenKey: 'record-00042',
      },
      {
        key: 'record-01902',
        userKey: 'record-00334',
        tokenKey: 'record-01606',
      },
    ],
  },
  {
    eventKey: 'record-01700',
    base: 'anchor',
    startMinute: -200,
    registrations: [
      {
        key: 'record-01420',
        userKey: 'record-00241',
        tokenKey: 'record-00375',
      },
      {
        key: 'record-02911',
        userKey: 'record-00283',
        tokenKey: 'record-00293',
      },
      {
        key: 'record-02402',
        userKey: 'record-00412',
        tokenKey: 'record-03101',
      },
      {
        key: 'record-00698',
        userKey: 'record-00122',
        tokenKey: 'record-01076',
      },
      {
        key: 'record-01441',
        userKey: 'record-02093',
        tokenKey: 'record-00655',
      },
      {
        key: 'record-02596',
        userKey: 'record-01983',
        tokenKey: 'record-03014',
      },
      {
        key: 'record-02297',
        userKey: 'record-02511',
        tokenKey: 'record-02037',
      },
      {
        key: 'record-01653',
        userKey: 'record-00524',
        tokenKey: 'record-01732',
      },
      {
        key: 'record-00479',
        userKey: 'record-00404',
        tokenKey: 'record-03071',
      },
      {
        key: 'record-01650',
        userKey: 'record-01608',
        tokenKey: 'record-01785',
      },
      {
        key: 'record-01889',
        userKey: 'record-03381',
        tokenKey: 'record-00591',
      },
      {
        key: 'record-01942',
        userKey: 'record-00334',
        tokenKey: 'record-02761',
      },
      {
        key: 'record-01696',
        userKey: 'record-00205',
        tokenKey: 'record-00869',
      },
      {
        key: 'record-01514',
        userKey: 'record-03389',
        tokenKey: 'record-01303',
      },
      {
        key: 'record-01533',
        userKey: 'record-03305',
        tokenKey: 'record-01031',
      },
    ],
  },
  {
    eventKey: 'record-00886',
    base: 'anchor',
    startMinute: -200,
    registrations: [
      {
        key: 'record-00553',
        userKey: 'record-00122',
        tokenKey: 'record-01857',
      },
      {
        key: 'record-02075',
        userKey: 'record-02093',
        tokenKey: 'record-02086',
      },
      {
        key: 'record-02890',
        userKey: 'record-01983',
        tokenKey: 'record-01586',
      },
      {
        key: 'record-00364',
        userKey: 'record-02511',
        tokenKey: 'record-02708',
      },
      {
        key: 'record-00201',
        userKey: 'record-00524',
        tokenKey: 'record-00737',
      },
      {
        key: 'record-00208',
        userKey: 'record-00404',
        tokenKey: 'record-01541',
      },
      {
        key: 'record-02050',
        userKey: 'record-01608',
        tokenKey: 'record-01498',
      },
      {
        key: 'record-03283',
        userKey: 'record-03381',
        tokenKey: 'record-03176',
      },
      {
        key: 'record-00503',
        userKey: 'record-00334',
        tokenKey: 'record-01036',
      },
      {
        key: 'record-00460',
        userKey: 'record-00205',
        tokenKey: 'record-02066',
      },
      {
        key: 'record-01006',
        userKey: 'record-03389',
        tokenKey: 'record-03124',
      },
      {
        key: 'record-01465',
        userKey: 'record-03305',
        tokenKey: 'record-03141',
      },
      {
        key: 'record-03223',
        userKey: 'record-00549',
        tokenKey: 'record-02147',
      },
      {
        key: 'record-00432',
        userKey: 'record-01971',
        tokenKey: 'record-01298',
      },
      {
        key: 'record-02334',
        userKey: 'record-02047',
        tokenKey: 'record-01402',
      },
    ],
  },
  {
    eventKey: 'record-02277',
    base: 'anchor',
    startMinute: -200,
    registrations: [
      {
        key: 'record-03084',
        userKey: 'record-02511',
        tokenKey: 'record-03422',
      },
      {
        key: 'record-03311',
        userKey: 'record-00524',
        tokenKey: 'record-02007',
      },
      {
        key: 'record-01191',
        userKey: 'record-00404',
        tokenKey: 'record-02783',
      },
      {
        key: 'record-01057',
        userKey: 'record-01608',
        tokenKey: 'record-01746',
      },
      {
        key: 'record-02907',
        userKey: 'record-03381',
        tokenKey: 'record-01829',
      },
      {
        key: 'record-00520',
        userKey: 'record-00334',
        tokenKey: 'record-03189',
      },
      {
        key: 'record-01213',
        userKey: 'record-00205',
        tokenKey: 'record-00369',
      },
      {
        key: 'record-03532',
        userKey: 'record-03389',
        tokenKey: 'record-02158',
      },
      {
        key: 'record-00808',
        userKey: 'record-03305',
        tokenKey: 'record-02831',
      },
      {
        key: 'record-02983',
        userKey: 'record-00549',
        tokenKey: 'record-02048',
      },
      {
        key: 'record-01515',
        userKey: 'record-01971',
        tokenKey: 'record-00114',
      },
      {
        key: 'record-00605',
        userKey: 'record-02047',
        tokenKey: 'record-00807',
      },
      {
        key: 'record-02582',
        userKey: 'record-01122',
        tokenKey: 'record-02672',
      },
      {
        key: 'record-02213',
        userKey: 'record-01880',
        tokenKey: 'record-02917',
      },
      {
        key: 'record-02868',
        userKey: 'record-02303',
        tokenKey: 'record-00995',
      },
    ],
  },
  {
    eventKey: 'record-01549',
    base: 'anchor',
    startMinute: -200,
    registrations: [
      {
        key: 'record-03370',
        userKey: 'record-01608',
        tokenKey: 'record-00805',
      },
      {
        key: 'record-02604',
        userKey: 'record-03381',
        tokenKey: 'record-00714',
      },
      {
        key: 'record-02961',
        userKey: 'record-00334',
        tokenKey: 'record-02306',
      },
      {
        key: 'record-03235',
        userKey: 'record-00205',
        tokenKey: 'record-02770',
      },
      {
        key: 'record-00811',
        userKey: 'record-03389',
        tokenKey: 'record-01851',
      },
      {
        key: 'record-01779',
        userKey: 'record-03305',
        tokenKey: 'record-02955',
      },
      {
        key: 'record-00851',
        userKey: 'record-00549',
        tokenKey: 'record-03403',
      },
      {
        key: 'record-02792',
        userKey: 'record-01971',
        tokenKey: 'record-00721',
      },
      {
        key: 'record-03188',
        userKey: 'record-02047',
        tokenKey: 'record-01781',
      },
      {
        key: 'record-00489',
        userKey: 'record-01122',
        tokenKey: 'record-02608',
      },
      {
        key: 'record-01826',
        userKey: 'record-01880',
        tokenKey: 'record-02755',
      },
      {
        key: 'record-01429',
        userKey: 'record-02303',
        tokenKey: 'record-00856',
      },
      {
        key: 'record-03237',
        userKey: 'record-01108',
        tokenKey: 'record-01175',
      },
      {
        key: 'record-00761',
        userKey: 'record-00242',
        tokenKey: 'record-01589',
      },
      {
        key: 'record-03455',
        userKey: 'record-02874',
        tokenKey: 'record-00693',
      },
    ],
  },
  {
    eventKey: 'record-00603',
    base: 'anchor',
    startMinute: -200,
    registrations: [
      {
        key: 'record-03329',
        userKey: 'record-00205',
        tokenKey: 'record-02107',
      },
      {
        key: 'record-01099',
        userKey: 'record-03389',
        tokenKey: 'record-02457',
      },
      {
        key: 'record-01831',
        userKey: 'record-03305',
        tokenKey: 'record-03345',
      },
      {
        key: 'record-02473',
        userKey: 'record-00549',
        tokenKey: 'record-00993',
      },
      {
        key: 'record-01578',
        userKey: 'record-01971',
        tokenKey: 'record-00546',
      },
      {
        key: 'record-01626',
        userKey: 'record-02047',
        tokenKey: 'record-00002',
      },
      {
        key: 'record-00240',
        userKey: 'record-01122',
        tokenKey: 'record-02175',
      },
      {
        key: 'record-03162',
        userKey: 'record-01880',
        tokenKey: 'record-02892',
      },
      {
        key: 'record-02615',
        userKey: 'record-02303',
        tokenKey: 'record-02492',
      },
      {
        key: 'record-02864',
        userKey: 'record-01108',
        tokenKey: 'record-02820',
      },
      {
        key: 'record-00180',
        userKey: 'record-00242',
        tokenKey: 'record-02136',
      },
      {
        key: 'record-00171',
        userKey: 'record-02874',
        tokenKey: 'record-03459',
      },
      {
        key: 'record-00959',
        userKey: 'record-02069',
        tokenKey: 'record-02026',
      },
      {
        key: 'record-01615',
        userKey: 'record-00715',
        tokenKey: 'record-02887',
      },
      {
        key: 'record-03423',
        userKey: 'record-01645',
        tokenKey: 'record-00601',
      },
    ],
  },
  {
    eventKey: 'record-00376',
    base: 'anchor',
    startMinute: -200,
    registrations: [
      {
        key: 'record-02024',
        userKey: 'record-00549',
        tokenKey: 'record-03436',
      },
      {
        key: 'record-01680',
        userKey: 'record-01971',
        tokenKey: 'record-01329',
      },
      {
        key: 'record-00527',
        userKey: 'record-02047',
        tokenKey: 'record-01625',
      },
      {
        key: 'record-03355',
        userKey: 'record-01122',
        tokenKey: 'record-00767',
      },
      {
        key: 'record-01483',
        userKey: 'record-01880',
        tokenKey: 'record-02551',
      },
      {
        key: 'record-00771',
        userKey: 'record-02303',
        tokenKey: 'record-03347',
      },
      {
        key: 'record-02114',
        userKey: 'record-01108',
        tokenKey: 'record-03031',
      },
      {
        key: 'record-02198',
        userKey: 'record-00242',
        tokenKey: 'record-00270',
      },
      {
        key: 'record-00193',
        userKey: 'record-02874',
        tokenKey: 'record-01121',
      },
      {
        key: 'record-02166',
        userKey: 'record-02069',
        tokenKey: 'record-01659',
      },
      {
        key: 'record-02249',
        userKey: 'record-00715',
        tokenKey: 'record-02910',
      },
      {
        key: 'record-02808',
        userKey: 'record-01645',
        tokenKey: 'record-02017',
      },
      {
        key: 'record-02969',
        userKey: 'record-00357',
        tokenKey: 'record-00449',
      },
      {
        key: 'record-02235',
        userKey: 'record-00979',
        tokenKey: 'record-00692',
      },
      {
        key: 'record-00681',
        userKey: 'record-03051',
        tokenKey: 'record-03510',
      },
    ],
  },
] as const;
export async function seedEventRegistrationsFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.EventRegistrationCreateManyInput[] =
    REGISTRATION_PLANS.flatMap((plan) =>
      plan.registrations.map((registration, index) => {
        const minutes = plan.startMinute + index;
        const isCancelled = index >= 13;
        return {
          id: context.getId(registration.key),
          eventId: context.getId(plan.eventKey),
          userId: context.getId(registration.userKey),
          statusId: context.getReference(
            'registration_statuses',
            isCancelled ? 'Cancelada' : 'Confirmada',
          ),
          qrToken: 'seed-' + context.getId(registration.tokenKey),
          registeredAt: context.getDate(plan.base, minutes, false),
          cancelledAt: isCancelled
            ? context.getDate(
                plan.base,
                minutes + (plan.base === 'monday' ? 2880 : 100),
                false,
              )
            : null,
          createdAt: context.getDate(plan.base, minutes, false),
          updatedAt: context.anchor,
        };
      }),
    );
  await tx.eventRegistration.createMany({ data, skipDuplicates: true });
  return data.length;
}
