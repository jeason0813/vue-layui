var jq,form,layer;
var loginUserInfo = [
    {
        name : "username",
        type : "input",
        label : "身份证/手机号",
        verify : "phoneOrIdentity",
        placeholder : "身份证或手机号"
    },
    {
        name : "password",
        type : "password",
        label : "密码",
        verify : "required",
        placeholder : "密码"
    }
];
var layerId;

var registerUserInfo = [
    {
        name : "mobile",
        type : "input",
        label : "手机号",
        verify : "phone",
        placeholder : "手机号"
    },
    {
        name : "username",
        type : "input",
        label : "身份证",
        verify : "identity",
        placeholder : "身份证"
    },
    {
        name : "password",
        type : "password",
        label : "密码",
        verify : "required",
        placeholder : "密码"
    }
];

layui.use(['table','jquery','layer'], function(){
    var table = layui.table;
    layerId = 0;
    jq = layui.jquery;
    layer = layui.layer;
    layer.config({
        skin: 'layui-layer-molv'
    });

    new Vue({
        el : "#login",
        data : {
            userInfo : loginUserInfo,
            submitBtn : [
                {
                    type : "submit",
                    text : "登陆"
                },
                {
                    $emit : "register",
                    text : "注册 <i class='layui-icon'>&#xe65b;</i>"
                }
            ],
            verify : {
                phoneOrIdentity : function (value,verify) {
                    if (value) {
                        if (value.length == 11) {
                            //手机号
                            return verify.phone(value);
                        } else {
                            return verify.identity(value);
                        }
                    } else {
                        return "手机号或身份证不能为空";
                    }
                }
            }
        },
        methods : {
            submitToServer : function (fields,verify) {
                userInfoCacheProxy.token = "";
                console.log(fields);
                var msg = "",
                    data;
                for(var i in fields) {
                    msg = verify[fields[i].verify](fields[i].value,verify);
                    if (msg) {
                        layer.msg(msg);
                        return;
                    }
                }
                data = {
                    username : fields.username.value,
                    mobile : fields.username.value,
                    password : fields.password.value
                };
                loading(true);
                ajax({
                    name : "login",
                    data : data,
                    success : function (ret) {
                        if (ret.code == apiReturnParam.successCode) {
                            //登陆成功，部门页面
                            userInfoCacheProxy.token = ret.token;
                            role.list = ret.currentRoleList;
                            layer.close(layerId);
                            layerId = layer.open({
                                title : "请选择一个身份",
                                content: jq("#role"),
                                type: 1,
                                shadeClose : false,
                                closeBtn : false,
                                resize : false,
                                area : ['500px', '300px']
                            });
                        } else {
                            layer.msg(ret.msg);
                        }
                        loading(false);
                    }
                })
            },
            register : function () {
                layer.close(layerId);
                layerId = layer.open({
                    title : "注册",
                    content: jq("#register"),
                    type: 1,
                    shadeClose : false,
                    closeBtn : false
                });
            }
        },
        mounted : function () {
        }
    });

    new Vue({
        el : "#register",
        data : {
            userInfo : registerUserInfo,
            submitBtn : [
                {
                    type : "submit",
                    text : "注册"
                },
                {
                    $emit : "login",
                    text : "登陆 <i class='layui-icon'>&#xe65c;</i>"
                }
            ]
        },
        methods : {
            submitToServer : function (fields,verify) {
                var msg = "",
                    data;
                for(var i in fields) {
                    msg = verify[fields[i].verify](fields[i].value,verify);
                    if (msg) {
                        layer.msg(msg);
                        return;
                    }
                }
                data = {
                    username : fields.username.value,
                    mobile : fields.mobile.value,
                    password : fields.password.value
                };
                console.log(fields);
                loading(true);
                ajax({
                    data : data,
                    name : "register",
                    success : function (ret) {
                        if (ret.code == apiReturnParam.successCode) {
                            layer.msg("注册成功，请登陆。");
                            layer.close(layerId);
                            layerId = layer.open({
                                title : "登陆",
                                content: jq("#login"),
                                type: 1,
                                shadeClose : false,
                                closeBtn : false
                            });
                        } else {
                            if (ret.msg == "数据库中已存在该记录") {
                                layer.msg("身份证或手机号已经被使用。");
                            } else {
                                layer.msg(ret.msg);
                            }
                        }
                        loading(false);
                    }
                });
            },
            login : function () {
                layer.close(layerId);
                layerId = layer.open({
                    title : "登陆",
                    shadeClose : false,
                    content: jq("#login"),
                    type: 1,
                    closeBtn : false
                });
            }
        }
    });

    role = new Vue({
        "el" : "#role",
        data : {
            color : [
                "layui-btn layui-btn-primary",
                "layui-btn",
                "layui-btn layui-btn-normal",
                "layui-btn layui-btn-warm",
                "layui-btn layui-btn-danger"
            ],
            list : []
        },
        methods : {
            select : function (ind) {
                console.log(ind);
                userInfoCacheProxy.roleId = this.list[ind].roleId;
                userInfoCacheProxy.deptName = this.list[ind].name;
                layer.close(layerId);
                pageManage.closePage("login");
            }
        },
        computed : {
            lists : function () {
                var color = this.color,
                    len = color.length,
                    li = [];
                this.list.forEach(function (lis,ind) {
                    li.push({
                        class : color[ind % len],
                        text : lis.name
                    });
                });
                return li;
            }
        }
    });

    //从 cookie 中获取 token 判断是否已经登陆
    if (userInfoCacheProxy.token) {
        //尝试登陆
        ajax({
            name : "login",
            success : function (ret) {
                loading(false);
                if (ret.code == apiReturnParam.successCode) {
                    //显示角色页
                    userInfoCacheProxy.token = ret.token;
                    role.list = ret.currentRoleList;
                    layerId = layer.open({
                        title : "请选择一个身份",
                        content: jq("#role"),
                        type: 1,
                        shadeClose : false,
                        closeBtn : false,
                        resize : false,
                        area : ['500px', '300px']
                    });
                } else {
                    layerId = layer.open({
                        title : "登陆",
                        content: jq("#login"),
                        type: 1,
                        shadeClose : false,
                        closeBtn : false
                    });
                }
            }
        });
    } else {
        loading(false);
        layerId = layer.open({
            title : "登陆",
            content: jq("#login"),
            type: 1,
            shadeClose : false,
            closeBtn : false
        });
    }

    setTimeout(function () {
        parent.layer.msg("随意 11 位数字的手机号和随意字符密码即可登陆。",{time : 5000});
    },1000);

    jq("#main").on("click",function () {
        var $this = this;
        this.style.display = "none";
        layer.open({
            type : 2,
            content : "../../images/main.png",
            area : ['100%','100%'],
            cancel : function () {
                $this.style.display = "block";
            }
        })
    });
});
