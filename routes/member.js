var express = require('express');
var router = express.Router();
var request=require('request');
const conn = require('../utils/dbUtils.js');
const sql = require('../dbBase/sql.js');

/* GET users listing. */
router.post('/login', function(req, res, next) {
  let query = req.body
  let url = `https://api.weixin.qq.com/sns/jscode2session?appid=wxa472f7234434d37b&secret=32720b8e3d1761889a3c75a6aca33ea7&js_code=${query.code}&grant_type=authorization_code`
  request(
    {
      url: url,
      method:'GET',
      headers:{'Content-Type':'text/json' }
    },
    (error,response,body) => {
      if(!error && response.statusCode==200){
        let data = JSON.parse(body)
        conn.query(sql.loginSql, data.openid, (err, results) => {
          if (err) {
            return res.json({
              resultCode: 5000,
              errorDescription: '登录失败'
            })
          }
          if (results && results.length === 0) {
            conn.query(sql.registerSql, [data.openid, query.avatar, query.nickname], (error, results) => {
              if (error) {
                return res.json({
                  resultCode: 5000,
                  errorDescription: '登录失败'
                })
              }
              return res.json({
                resultCode: 200,
                data: body
              })
            })
          } else {
            conn.query(sql.updateUserSql, [query.nickname, query.avatar, data.openid], (error, results) => {
              return res.json({
                resultCode: 200,
                data: body
              })
            })
          }
        })
      } else {
        return res.json({
          resultCode: 5000,
          errorDescription: '登录失败'
        })
      }
    });
});

router.post('/getFollowAndFens', async function(req, res, next) {
  let query = req.body
  let followList = null
  let fensList = null
  await conn.query(sql.getFollowSql, query.openid, (error, results) => {
    if (error) {
      return res.json({
        resultCode: 5000,
        errorDescription: '获取失败'
      })
    }
    followList = results
  })
  await conn.query(sql.getFensSql, query.openid, (error, results) => {
    if (error) {
      return res.json({
        resultCode: 5000,
        errorDescription: '获取失败'
      })
    }
    fensList = results
    return res.json({
      resultCode: 200,
      data: {
        fensList,
        followList
      }
    })
  })
})

router.post('/getRecommend', function(req, res, next) {
  conn.query(sql.getRecommendSql, [req.body.openid, req.body.openid], (error, results) => {
    if (error) {
      console.log(error)
      return res.json({
        resultCode: 5000,
        errorDescription: '获取失败'
      })
    }
    return res.json({
      resultCode: 200,
      data: {
        recommendList: results || []
      }
    })
  })
})

router.post('/addFollow', function(req, res, next) {
  let query = req.body
  conn.query(sql.addFollowSql, [query.openid, query.friendid], (error, results) => {
    if (error) {
      return res.json({
        resultCode: 5000,
        errorDescription: '添加失败'
      })
    }
   if (results&&results.insertId > 0) {
     return res.json({
       resultCode: 200
     })
   } else {
     return res.json({
       resultCode: 5000,
       errorDescription: '添加失败'
     })
   }
  })
})

router.post('/cancelFollow', function(req, res, next) {
  let query = req.body
  conn.query(sql.cancelFollowSql, [query.openid, query.friendid], (error, results) => {
    if (error) {
      console.log(error)
      return res.json({
        resultCode: 5000,
        errorDescription: '取消失败'
      })
    }
    if (results&&results.affectedRows > 0) {
      return res.json({
        resultCode: 200
      })
    } else {
      return res.json({
        resultCode: 5000,
        errorDescription: '取消失败'
      })
    }
  })
})

router.post('/getUserNoteInfo', function (req, res, next) {
  let query = req.body
  conn.query(sql.getUserInfo, query.openid, (error, results) => {
    if (error) {
      return res.json({
        resultCode: 5000,
        errorDescription: '获取失败'
      })
    }
    conn.query(sql.getNoteInfoSql, query.openid, (error1, results1) => {
      if (error1) {
        return res.json({
          resultCode: 5000,
          errorDescription: '获取失败'
        })
      }
      if (results&&results1) {
        return res.json({
          data: {
            userInfo: results[0] || null,
            total: results1[0]['count(*)'] || 0
          },
          resultCode: 200
        })
      } else {
        return res.json({
          resultCode: 5000,
          errorDescription: '暂无数据'
        })
      }
      console.log(results, results1)
    })
  })
})

module.exports = router;