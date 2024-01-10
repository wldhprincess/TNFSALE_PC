/*
//------------------ JXSLIDER  ------------------ //
version( 버전 ) : x10
date ( 날짜 ) : 2020.01.07


수정
this.addEventAction() 안에 seTimeOut으로 감쌌다. click 이벤트 안에서 슬라이드가 움직이는것을 알수가 없어서

추가 :

bAaptiveHeight 옵션 true 일때
1. setAptiveHeight 함수를 추가
- 높이가 다른 컨텐츠를 이용하는 컨텐츠에서 리사이징 할때에도 높이를 컨텐츠에 맞춰서 조절을 해야하는 함수
- reSet , callback 함수에  setAptiveHeight 함수 호출 부분 추가

*/

function JXSLIDER(obj, option) {
    var _this = this;
    this.defaults = {
        nView: 1, //화면에 몇개의 객체를 보여줄것인가
        sDirection: "horizontal", //움직이는 방향 or vertical
        nMargin: 0, //sDirection에 따라 margin-right or margin-bottom 값
        nOnMargin: 0, //클래스 on인 li에 마진은 다르게 주기 위함
        nAutoSpeed: 3000, //자동롤링 속도
        nUlSpeed: 400, //움직이는 속도<1601></1601>
        bAuto: false, //자동롤링
        bDrag: true, //드래그 가능
        bLoop: true, //무한 반복
        bResize: true, //li 객체를 jxbox 박스 기준으로 리사징을 할것인가 여부(true:기본 or false)
        nSans: 100, //드래그 온하고 오프햇을때 드래그 한정도에 따라서 다시 제자리로 오느냐 아님 이동하느냐에 민감도 ( 기본값:10 )
        bGroupMove: false, //nView에 값에 따라서 이동을 한꺼번에 할것인가 아닌가
        bAction: false, //li 객체를 클릭하면 칸 차이를 인식하여 이동 링크가 아닌 이동 loop를 true로 바꿔야할듯
        nStart: 0, // 앞객체를 뒤로 붙여서 몇번째 객체를 처음부터 보여줄려할때 , nBackCopy작동안함. *loop가 false가 될경우만 작동
        nBackCopy: 0, // 뒤객체를 앞으로 붙여서 센터 정렬. margin-left로 센터 조정해야함. nStart가 0이여야함 *loop가 false가 될경우만 작동
        oResponsive: [],
        bAaptiveHeight: false, //높이값에 맞게 조절

        sEffectClass: 'jx-cont', //어떤 객체에 효과를 적용할것인지
        //sEffectClass : 'thumb' ,
        oEffect: [
            /*
            {
                name : 'transform' ,
                ef :
                [
                    {name : 'rotateY', max : 0, min : 70 },
                    {name : 'scale', max : 1, min : .7 }
                ]
            } ,
            {
                name : 'opacity', max : 1, min : 1.5
            }
            */
        ],
        reCallFnc: function (v) {
            console.log('defaults reCallFnc', v)
        }
    }

    $.extend(true, this.defaults, option);


    this.oriView = this.defaults.nView; //반응형으로 인한 원래 nView값을 담을 변수
    this.nWinBox = $(window).width(); // 처음에 윈도우 사이즈


    //피씨와 모바일 체크
    (function (a, b) {
        var ua = a.userAgent.toLowerCase();
        var pl = a.platform.toLowerCase();
        var mx = a.maxTouchPoints;

        if (/mobile/i.test(ua) || /ipad|iphone|ipod/i.test(pl) || (pl === 'macintel' && mx > 1)) {
            _this.bMobile = true;
        } else {
            _this.bMobile = false;
        }
    })(navigator, 'm/')

    this.jxslider = obj;
    this.jxbox = this.jxslider.find("> .jx-box"); //ul을 감싸고 있는 부모 클래스
    this.jxwrap = this.jxbox.find("> .jx-wrap");
    this.bIng = false; // 좌우 버튼이나 아래 컨트롤을 이용하여 움직임이 시작했느냐
    this.bMovIng = false; // 드래그 이용하여 움직임이 시작했느냐
    this.bControl = false; //아래 페이징이 있을겨우를 참조 하는 변수
    this.nTotal = this.jxwrap.find(">.jx-unit").size(); // .jxunit 의 총 갯수
    this.bPcIng = false; // pc에선 마우스 무브가 계속 움직이므로 그러나 공통으로 하면 된다.
    this.nCopy = 0; //드래그 하는 동안 몇개의 .jxunit를 이동할것인가를 담는 변수
    this.nSave = 0; // 전 this.nCopy 를 담는 변수이며 두 숫자가 달라졌을때만 .jxunit를 이동한다.
    this.nEX = this.nEY = 0; //ul 의 이동완료 된후 left or top 값을 담는다.
    this.nAddStep = 0; // 몇개의 .jxunit가 이동하는
    this.autoTime;
    this.sEase = 'easeOutCubic';


    //.jxunit의 고유 데이터 넘버를 넣어버린다.
    this.jxwrap.find(">.jx-unit").each(function (i, e) {
        $(this).attr("data-num", i);
        var $num = $("<span class='num'>" + (i + 1) + "</span>")
        $(this).find("> .jx-cont").append($num)
    });


    if (_this.defaults.sDirection != "horizontal") {
        //세로방향일때고 리사이징일때만
        if (_this.defaults.bResize) {
            this.jxslider.addClass("jx-vertical");
        }
    }

    //페이징이 존재하면  그룹별 움직임에 true를 넣어버리고 or 그룹별 움직임이 true라면
    //if ( this.jxslider.find(".jxcontrol").size() > 0 || this.defaults.bGroupMove )

    if (this.jxslider.find("> .jx-control").size() > 0) {
        this.bControl = true;
    } else {
        this.bControl = false;
    }

    _this.reSet();

    if (_this.defaults.bLoop) {
        if (this.defaults.nStart == 0) {
            this.nCurr = this.nCurrPaging = 0;

            if (this.defaults.bGroupMove) {
                this.defaults.nBackCopy = this.defaults.nBackCopy % this.defaults.nView;
            }
        } else {
            _this.defaults.nBackCopy = 0;
            //if ( _this.defaults.bGroupMove  || this.bControl )
            if (_this.defaults.bGroupMove) {
                /*
                동작이 그룹단위로 움직여야 할경우인데
                앞에서 뒤로 붙이는 옵션 ( nStart : 몇번째 부터 시작을 할까요 옵션 ) 값이 1, 2 들어온다 하여도 씽크는 맞춰야 하기 때문에
                nView 값을 넣어버려야한다.
                */

                this.defaults.nStart = Math.ceil(_this.defaults.nStart / _this.defaults.nView) * _this.defaults.nView; //계산을 맞춰서 해야해서 그룹별이나 버튼이 잇을때는 다시 값을 바꿔야함

                if (this.defaults.nStart > this.nTotal - 1) {
                    this.defaults.nStart = this.nTotal - 1;
                }

                this.nCurrPaging = Math.floor(_this.defaults.nStart / _this.defaults.nView); //아래 페이징이 있을경우 초기값
            } else {
                if (this.defaults.nStart > this.nTotal - 1) {
                    this.defaults.nStart = this.nTotal - 1;
                }

                this.nCurrPaging = this.defaults.nStart;
            }

            this.nCurr = _this.defaults.nStart;
        }
    } else {
        this.nCurr = this.nCurrPaging = this.defaults.nStart = this.defaults.nBackCopy = 0;
    }


    if (this.defaults.bAuto) {
        this.addEventAuto(true);
    }

    if (_this.defaults.bLoop) {
        if (_this.defaults.nBackCopy != 0) {
            for (var i = 0; i < _this.defaults.nBackCopy; i++) {
                this.jxwrap.prepend(this.jxwrap.find(">.jx-unit:last"));
            }
        } else {
            for (var i = 0; i < _this.defaults.nStart; i++) {
                this.jxwrap.append(this.jxwrap.find(">.jx-unit:first"));
            }

        }
    }

    _this.jxwrap.find(">.jx-unit").eq(_this.defaults.nBackCopy).addClass("on"); //처음에 한번


    if (_this.defaults.nMargin != 0) {
        if (_this.defaults.nOnMargin == 0 || _this.defaults.nOnMargin < _this.defaults.nMargin) {
            _this.defaults.nOnMargin = _this.defaults.nMargin;
        }
    }

    if (!_this.defaults.bResize) {
        //리사이징이 아닐때 jx-unit 객체 가로 세로 사이즈를 가지고 움직일 값을 담는다
        if (_this.defaults.sDirection == "horizontal") {
            this.nMove = this.jxwrap.find(">.jx-unit").innerWidth() + _this.defaults.nMargin;
            //this.nOnMove =   this.jxwrap.find(">.jx-unit").innerWidth() + _this.defaults.nOnMargin;
            // this.jxwrap.find(">.jx-unit").css(  {"margin-right": _this.defaults.nMargin} );
            // this.jxwrap.css( {"width": this.nMove * this.nTotal } ) // ul의 가로 사이즈를 .jx-unit의 갯수만큼

            this.jxwrap.find(">.jx-unit").each(function (i, e) {
                if ($(this).hasClass('on')) {
                    $(this).css({ "margin-left": _this.defaults.nOnMargin - _this.defaults.nMargin, "margin-right": _this.defaults.nOnMargin });
                } else {
                    $(this).css({ "margin-right": _this.defaults.nMargin });
                }

            });

            this.jxwrap.css({ "width": (this.nMove * (this.nTotal + 1)) + this.defaults.nOnMargin * 2 }) // ul의 가로 사이즈를 .jx-unit의 갯수만큼
        } else {
            this.nMove = this.jxwrap.find(">.jx-unit").innerHeight() + _this.defaults.nMargin;
            //this.nMove =   this.jxwrap.find(">.jx-unit").innerHeight() + _this.defaults.nOnMargin;
            // this.jxwrap.find(">.jx-unit").css(  {"float": "none", "margin-bottom": _this.defaults.nMargin } );
            // this.jxwrap.css( {"height": this.nMove * this.nTotal } ) // ul의 가로 사이즈를 .jx-unit의 갯수만큼

            this.jxwrap.find(">.jx-unit").each(function (i, e) {
                if ($(this).hasClass('on')) {
                    $(this).css({ "float": "none", "margin-top": _this.defaults.nOnMargin - _this.defaults.nMargin, "margin-bottom": _this.defaults.nOnMargin });
                } else {
                    $(this).css({ "float": "none", "margin-bottom": _this.defaults.nMargin });
                }
            });

            this.jxwrap.css({ "height": (this.nMove * (this.nTotal - 1)) + this.defaults.nOnMargin * 2 }); // ul의 가로 사이즈를 .jx-unit의 갯수만큼

        }
    } else {
        //리사이징일때는 여기서 계산
        //$(window).unbind();
        $(window).resize(function (e) {
            _this.resize();
        });
        $(window).trigger("resize");
    }


    //기본 드래그 이벤트 추가
    //this.bMobile = ( option["bMobile"]  != undefined && option["bMobile"]  != "" ) ? option["bMobile"] :  false; // 모바일 체크이다. 기본은 pc 작동


    //좌우 버튼이 있는 경우만 좌우 버튼 이벤트 추간
    if (this.jxslider.find("> .jx-btn").size() > 0) {
        this.addEventBtns();
    }

    if (this.jxslider.find(".jx-stop").size() > 0) {
        this.addEventStop();
    }

    if (_this.defaults.bAction) {
        this.addEventAction();
    }

    if (_this.defaults.bDrag) {

        this.addEventDrag();
    }

    if (_this.defaults.oEffect.length > 0) {
        _this.addEnterFrame(); //효과를 좌우로 바로 넣기 위함
    }

    if (this.defaults.bAaptiveHeight) {
        this.setAptiveHeight();
    }

} //function JXSLIDER



JXSLIDER.prototype.setAptiveHeight = function () {
    var _this = this;
    var nH;

    if (_this.defaults.bLoop) {
        nH = _this.jxwrap.find(">.jx-unit").eq(_this.defaults.nBackCopy).innerHeight();
    } else {
        nH = _this.jxwrap.find(">.jx-unit").eq(_this.nCurr).innerHeight();
    }

    if (nH > 0) {
        //_this.jxwrap.css({ "height": nH + 'px' });
        _this.jxwrap.stop().animate({ "height": nH }, _this.defaults.nUlSpeed, _this.sEase);
    } else {
        this.setAptiveHeight();
    }

}//setAptiveHeight


JXSLIDER.prototype.reSet = function () {
    var _this = this;
    //console.log('defaults  ' , this.defaults.oResponsive.length , this.defaults.sDirection , $(window).width() );

    if (this.defaults.sDirection == "horizontal") {
        //가로모드일때만 반응형
        var leng = this.defaults.oResponsive.length;
        //console.log( leng )
        if (leng > 0) {
            this.defaults.bGroupMove = false;

            for (var i in this.defaults.oResponsive) {
                if ($(window).width() + 17 >= this.defaults.oResponsive[leng - 1 - i].breakpoint) {
                    this.defaults.nView = this.oriView;
                } else {
                    this.defaults.nView = this.defaults.oResponsive[leng - 1 - i].settings.nView;
                    break;
                }
            } //for
        } //if

        if (_this.defaults.bAaptiveHeight) {
            setTimeout(function () { _this.setAptiveHeight() }, 10);
        }


    } //if

    //re
    if (this.defaults.bGroupMove) {
        this.nTotalPaging = Math.ceil(this.nTotal / _this.defaults.nView); //아래 페이징이 있을경우 총 페이징 값
    } else {
        this.nTotalPaging = this.nTotal;
    }

    if (this.bControl)
    //if ( this.defaults.bGroupMove )
    {
        this.jxcontrol = this.jxslider.find("> .jx-control");
        //console.log('시작 ' , this.bMovIng)
        this.addEventControl(); //아래 페이징이 있는 경우만 이벤트 추가
    }

} //JXSLIDER.prototype.reSet

//본인 자신을 클릭하면 움직임 추가
JXSLIDER.prototype.addEventAction = function (b) {
    var _this = this;

    function numFind() {
        var idx;
        _this.jxwrap.find(">.jx-unit").each(function (i, e) {
            //console.log(i , $(this).attr("class") )
            if ($(this).hasClass("on")) {
                idx = $(this).index();
            }
        });

        return idx;
    }

    /*
        링크가 있는경우가 문제이다
        pc 경우는 문제가 되기 때문에 드래그 기능을 못하도록 해는데
        e.preventDefault();작동되게 하려면 click 이벤트를 넣어야한다. }
    */
    this.jxwrap.find(">.jx-unit").on("mouseup", function (e) {
        setTimeout(function () {
            //  console.log('mouseup' , _this.bPcIng , _this.bMovIng , _this.jxwrap.is(':animated') )
        }, 1)
    })


    this.jxwrap.find(">.jx-unit").on("click", function (e) {

        //e.stopPropagation();

        _this.bPcIng = false;
        var nChr = numFind() - $(this).index();

        if (nChr != 0) {
            e.preventDefault();
        }

        setTimeout(function () {
            if (_this.bMovIng || _this.jxwrap.is(':animated')) {
                return;
            }

            if (_this.defaults.bGroupMove) {
                if (nChr < 0) {
                    if (_this.nCurr + _this.defaults.nView > _this.nTotal - 1) {
                        _this.rcal(_this.nTotal - _this.nCurr);
                    } else {
                        //_this.right( _this.defaults.nView );
                        _this.rcal(_this.defaults.nView);
                    }
                }
                if (nChr > 0) {
                    if (_this.nCurr - _this.defaults.nView < 0 && _this.nTotal % _this.defaults.nView != 0) {
                        _this.lcal(_this.nTotal % _this.defaults.nView);
                    } else {
                        _this.lcal(_this.defaults.nView);
                    }
                }
            } else {
                if (nChr < 0) {
                    _this.rcal(Math.abs(nChr));
                }

                if (nChr > 0) {
                    _this.lcal(Math.abs(nChr));
                }
            }
        }, 1);
    });


} //JXSLIDER.prototype.addEventAction

//스탑 버튼에 이벤트 추가
JXSLIDER.prototype.addEventStop = function (b) {
    var _this = this;

    this.jxslider.find(".jx-stop").click(function (event) {
        $(this).toggleClass("on");
        if ($(this).hasClass("on")) {
            //$(this).text("play");
            $(this).addClass("on");
            _this.defaults.bAuto = false;
            _this.addEventAuto(false);
        } else {
            //$(this).text("stop");
            $(this).removeClass("on");
            _this.defaults.bAuto = true;
            _this.addEventAuto(true);
        }
    });
} //addEventStop

//자동으로 이동
JXSLIDER.prototype.addEventAuto = function (b) {
    var _this = this;

    //console.log("addEventAuto  " ,b)
    if (b) {
        clearInterval(_this.autoTime)
        _this.autoTime = setInterval(function () {
            _this.right();
            //_this.lv();

        }, _this.defaults.nAutoSpeed);
    } else {
        clearInterval(_this.autoTime)
    }
}

//좌우 버튼 이벤트
JXSLIDER.prototype.addEventBtns = function () {
    var _this = this;

    this.jxslider.find("> .jx-left").click(function (e) {

        //console.log('jx-left ' , _this.nCurr , _this.defaults.bGroupMove)
        _this.left();
    }).mouseenter(function (event) {
        if (_this.defaults.bAuto) { _this.addEventAuto(false); }
    }).mouseleave(function (event) {
        if (_this.defaults.bAuto) { _this.addEventAuto(true); }
        _this.bMovIng = false;
    });

    this.jxslider.find("> .jx-right").click(function (e) {
        //_this.rcal(1);
        //그룹 모션이 참일때 조건을 더 넣자.

        _this.right();

    }).mouseenter(function (event) {
        if (_this.defaults.bAuto) { _this.addEventAuto(false); }
    }).mouseleave(function (event) {
        if (_this.defaults.bAuto) { _this.addEventAuto(true); }

        _this.bMovIng = false;
    });

} //JXSLIDER.prototype.addEventBtns

JXSLIDER.prototype.left = function () {
    var _this = this;
    if (!_this.bIng) {
        _this.bIng = true;
        if (_this.defaults.bGroupMove) {
            if (_this.nCurr - _this.defaults.nView < 0 && _this.nTotal % _this.defaults.nView != 0) {
                _this.lcal(_this.nTotal % _this.defaults.nView);
            } else {
                _this.lcal(_this.defaults.nView);
            }
        } else {
            _this.lcal(1);
        }

        if (_this.defaults.bAuto) { _this.addEventAuto(true); }
    }
} //JXSLIDER.prototype.left

//오른쪽 버튼 클릭시 실제 동작
JXSLIDER.prototype.right = function () {
    var _this = this;

    if (!_this.bIng) {
        _this.bIng = true;
        if (_this.defaults.bGroupMove) {
            //console.log( 'right ' , _this.nCurr )
            if (_this.nCurr + _this.defaults.nView > _this.nTotal - 1) {
                _this.rcal(_this.nTotal - _this.nCurr);
            } else {
                _this.rcal(_this.defaults.nView);
            }
        } else {
            _this.rcal(1);
        }

        if (_this.defaults.bAuto) { _this.addEventAuto(true); }
    }
} //JXSLIDER.prototype.right


//왼쪽 버튼 클릭시 이벤트
JXSLIDER.prototype.lcal = function (n) {
    var _this = this;

    var n = n;

    //console.log('lv ' , n )

    if (n == undefined) { n = 1; }

    //console.log('lv  ' , n , _this.defaults.bLoop )
    if (_this.defaults.bLoop) {
        //loop 일때

        _this.nCurr -= n;
        if (_this.nCurr < 0) {
            //_this.nCurr =  _this.nTotal-1;
            _this.nCurr = _this.nTotal + _this.nCurr;
        }

        if (_this.defaults.bGroupMove) {
            _this.nCurrPaging = _this.nCurr / _this.defaults.nView;
        } else {
            _this.nCurrPaging = _this.nCurr;
        }

        _this.lmv(n);
    } else {
        //loop 아닐때
        //if ( _this.bControl || _this.defaults.bGroupMove )
        if (_this.defaults.bGroupMove) {
            //컨트롤이 존재할때
            if (!_this.defaults.bAuto) {
                //자동이 아닐때
                if (_this.nCurrPaging > 0) {
                    _this.nCurrPaging--;
                    _this.nCurr = _this.nCurrPaging * _this.defaults.nView;
                    _this.lmv(_this.nCurr);
                } else {
                    //alert ("첫 페이지");
                    _this.bIng = false;
                    //console.log('첫 페이지')
                }
            } else {
                //자동때
                _this.nCurrPaging--;
                if (_this.nCurrPaging < 0) {
                    _this.nCurrPaging = _this.nTotalPaging - 1;
                }
                _this.nCurr = _this.nCurrPaging * _this.defaults.nView;
                _this.lmv(_this.nCurr);

            }
        } else {
            //컨트롤이 없을때
            if (!_this.defaults.bAuto) {
                if (_this.nCurr > 0) {
                    _this.nCurr -= n;
                    _this.lmv(_this.nCurr);
                } else {
                    _this.bIng = false;
                    //console.log('첫 페이지');
                }
            } else {
                _this.nCurr -= n;
                if (_this.nCurr < 0) {
                    _this.nCurr = _this.nTotal - _this.defaults.nView;
                }
                _this.lmv(_this.nCurr);
            }

            _this.nCurrPaging = _this.nCurr;

        } // if ( _this.bControl )
    } //if ( _this.defaults.bLoop )

} //JXSLIDER.prototype.lcal


//오른쪽 버튼 클릭시 이벤트
JXSLIDER.prototype.rcal = function (n) {
    var _this = this;

    var n = n;

    if (n == undefined) { n = 1; }

    if (_this.defaults.bLoop) {
        //loop 일때
        _this.nCurr += n;

        if (_this.nCurr > _this.nTotal - 1) {
            //_this.nCurr = 0;
            _this.nCurr = _this.nCurr - _this.nTotal;
        }

        if (_this.defaults.bGroupMove) {
            _this.nCurrPaging = _this.nCurr / _this.defaults.nView;
        } else {
            _this.nCurrPaging = _this.nCurr;
        }

        //_this.right(1);
        _this.rmv(n);
    } else {
        //loop 아닐때
        //if ( _this.bControl || _this.defaults.bGroupMove )
        if (_this.defaults.bGroupMove) {
            //그룹으로
            if (!_this.defaults.bAuto) {
                if (_this.nCurrPaging < _this.nTotalPaging - 1) {
                    _this.nCurrPaging++;
                    _this.nCurr = _this.nCurrPaging * _this.defaults.nView;
                    _this.rmv(_this.nCurr);
                } else {
                    //alert ("마지막 페이지");
                    _this.bIng = false;
                }

            } else {
                _this.nCurrPaging++;
                if (_this.nCurrPaging > _this.nTotalPaging - 1) {
                    _this.nCurrPaging = 0;
                }
                _this.nCurr = _this.nCurrPaging * _this.defaults.nView;
                _this.rmv(_this.nCurr);
            }
        } else {
            //그룹 아니고
            if (!_this.defaults.bAuto) {
                //if ( _this.nCurr < _this.nTotal-_this.defaults.nView )
                if (_this.nCurr < _this.nTotal - 1) {
                    _this.nCurr += n;
                    _this.rmv(_this.nCurr);
                } else {
                    _this.bIng = false;
                    //console.log('마지막 페이지');
                }
            } else {
                _this.nCurr += n;
                //if ( _this.nCurr > _this.nTotal-_this.defaults.nView )
                if (_this.nCurr > _this.nTotal - 1) {
                    _this.nCurr = 0;
                }
                _this.rmv(_this.nCurr);
            }

            _this.nCurrPaging = _this.nCurr;
        } //if ( _this.bControl )
    } //if ( _this.defaults.bLoop )

} //rcal


//왼쪽 버튼 클릭시 실제 동작
JXSLIDER.prototype.lmv = function (v) {

    var _this = this;
    var ntx = _this.nMove * v * -1; //최종 움직일 칸 사이즈



    if (_this.defaults.bLoop) {
        _this.jxwrap.find(">.jx-unit").each(function (index, element) {
            if (_this.nTotal - 1 - v < index) {
                var last = _this.jxwrap.find(">.jx-unit:last");
                _this.jxwrap.prepend(last);
            }
        });


        if (_this.defaults.sDirection == "horizontal") {
            _this.jxwrap.css({ "left": ntx });
        } else {
            _this.jxwrap.css({ "top": ntx });
        }
        ntx = 0;
    }

    //console.log('lmv ' ,  _this.nCurr )

    _this.addEventMoment();

    if (_this.defaults.sDirection == "horizontal") {
        _this.jxwrap.stop().animate({ "left": ntx }, _this.defaults.nUlSpeed, _this.sEase, function () {
            _this.nEX = _this.jxwrap.position().left;
            //console.log('left end '  , _this.nEX , ntx)
            end();
        });

    } else {

        _this.jxwrap.stop().animate({ "top": ntx }, _this.defaults.nUlSpeed, _this.sEase, function () {
            _this.nEX = _this.jxwrap.position().top;
            end();
        });
    }

    function end() {
        _this.bIng = false;

        _this.callback();

    } //end

} //JXSLIDER.prototype.lmv


JXSLIDER.prototype.rmv = function (v) {
    var _this = this;
    var ntx = _this.nMove * v * -1; //최종 움직일 칸 사이즈

    //console.log('rmv ' , v , _this.nCurr , _this.nTotal , _this.nTotalPaging , ntx)
    //console.log('rmv ' , _this.nCurr )

    _this.addEventMoment();

    if (_this.defaults.sDirection == "horizontal") {

        _this.jxwrap.stop().animate({ "left": ntx }, _this.defaults.nUlSpeed, _this.sEase, function () {
            _this.nEX = _this.jxwrap.position().left;
            //console.log('right end '  , _this.nEX , _this.jxwrap.offset().left )
            end();
        });
    } else {
        _this.jxwrap.stop().animate({ "top": ntx }, _this.defaults.nUlSpeed, _this.sEase, function () {
            _this.nEX = _this.jxwrap.position().top;
            end();
        });

    }

    function end() {
        _this.bIng = false;

        if (_this.defaults.bLoop) {
            if (_this.defaults.sDirection == "horizontal") {
                _this.jxwrap.css({ "left": 0 });
            } else {
                _this.jxwrap.css({ "top": 0 });

            }

            _this.jxwrap.find(">.jx-unit").each(function (index, element) {
                if (v > index) {
                    var copy = $(this);
                    _this.jxwrap.append(copy);
                }
            });

            _this.nEX = _this.nEY = 0;

        }

        _this.callback();
    }
} //JXSLIDER.prototype.rmv

JXSLIDER.prototype.addEnterFrame = function () {
    //좌우 버튼 클릭하면 바로 효과 주기 위함
    var _this = this;

    //최대치와 최저치를 옵션에서 결정하면 좋을듯
    /*
    var max = 1;
    var min = .5;
  
    var effect =
    {
        scale :
        {
            max : 1,
            min : .5
        },
        opacity :
        {
            max : 1,
            min : .5
        }
  
    }
    */

    _this.nBase = _this.nMove * _this.defaults.nBackCopy; //기준이 되는 거리

    if (_this.defaults.sDirection == "horizontal") {
        //_this.nCenter = _this.jxwrap.offset().left + _this.nBase; //부모 거리에서 기준이 되는 거리를 더해서
        _this.nCenter = _this.defaults.bResize ? _this.jxwrap.offset().left + _this.nBase : _this.jxwrap.position().left + _this.nBase; //부모 거리에서 기준이 되는 거리를 더해서
    } else {
        _this.nCenter = _this.defaults.bResize ? _this.jxwrap.offset().top + _this.nBase : _this.jxwrap.position().top + _this.nBase; //부모 거리에서 기준이 되는 거리를 더해서
    }


    var sClass = $.trim(_this.defaults.sEffectClass);


    //sCalss = 'thumb';

    //console.log(_this.defaults.sEffectClass)
    var cuv = 1;


    var sEffectName = '';
    setInterval(function () {
        //console.log('sClass'  , sClass)
        //console.log( 'addEnterFrame' , _this.defaults.bResize , _this.nCenter )

        _this.jxwrap.find(">.jx-unit").each(function (i, e) {
            //var pot =$(this).offset().left; //객체들 원래 위치값이가고
            var pot // = _this.defaults.bResize ? $(this).offset().left : $(this).position().left //객체들 원래 위치값이가고

            if (_this.defaults.sDirection == "horizontal") {
                pot = _this.defaults.bResize ? $(this).offset().left : $(this).position().left //객체들 원래 위치값이가고

            } else {
                pot = _this.defaults.bResize ? $(this).offset().top : $(this).position().top //객체들 원래 위치값이가고

            }
            var distance = pot - _this.nCenter; //기준 거리에서 본인의 거리를 빼서 거리를 잰다

            //rotation 일경우 좌우 각도가 -1을 가질수도 있기 때문에
            if ($(this).index() < _this.defaults.nBackCopy) {
                cuv = 1;
            }
            if ($(this).index() > _this.defaults.nBackCopy) {
                cuv = -1;
            }

            if (Math.abs(distance) >= _this.nBase) {
                //distance = _this.nBase; //기본 무빙 사이즈보다 크면 넘어가지 않도록 하기 위함
            }

            var effectObj = $(this).find('.' + sClass);

            //효과 넣은 별로
            for (j in _this.defaults.oEffect) {

                var name = $.trim(_this.defaults.oEffect[j].name);

                if (name == 'opacity') {
                    var max = _this.defaults.oEffect[j].max;
                    var min = _this.defaults.oEffect[j].min;

                    //var tar = ( min - max ) / ( 0 - _this.nBase ) * ( 0 - Math.abs( distance )   ) + max; //이건 거리에 맞춰서 점점 크기가 다르게 되어있고
                    var tar = (min - max) / (0 - _this.nMove) * (0 - Math.abs(distance)) + max;

                    if (max >= min) {
                        if (tar < min) { tar = min; } // 제일 중요한 부분
                    } else {
                        if (tar < max) { tar = max; } // 제일 중요한 부분
                    }

                    effectObj.css({ 'opacity': tar });
                } else if (name == 'transform') {
                    sEffectName = '';

                    for (m in _this.defaults.oEffect[j].ef) {

                        var max = _this.defaults.oEffect[j].ef[m].max;
                        var min = _this.defaults.oEffect[j].ef[m].min;
                        var name = $.trim(_this.defaults.oEffect[j].ef[m].name)
                        //var tar = ( min - max ) / ( 0 - _this.nBase ) * ( 0 - Math.abs( distance )   ) + max; //이건 거리에 맞춰서 점점 크기가 다르게 되어있고
                        var tar = (min - max) / (0 - _this.nMove) * (0 - Math.abs(distance)) + max;

                        if (name == 'scale') {
                            if (max >= min) {
                                if (tar <= min) { tar = min; }; // 제일 중요한 부분
                            } else {
                                if (tar <= max) { tar = max; }; // 제일 중요한 부분
                            }
                            sEffectName += name + '(' + (tar) + ')';
                        } else if (name == 'rotateY') {
                            if (max >= min) {
                                if (tar > min) { tar = min; }; // 제일 중요한 부분
                            } else {
                                if (tar > max) { tar = max; }; // 제일 중요한 부분
                            }
                            sEffectName += name + '(' + (tar * cuv) + 'deg)  ';
                        }


                        effectObj.css({ 'transform': sEffectName });
                        //console.log( m , tar , effectObj , sEffectName )
                    }
                }
            }

            //console.log( $(this).hasClass('on') )
            //$(this).find('.thumb').css({ 'transform' : 'scale('+ ( tar * cuv ) +')' , 'opacity' : tar });

        });
    }, 10);

} //JXSLIDER.prototype.addEnterFrame

JXSLIDER.prototype.addEventMoment = function () {
    var _this = this;



    _this.jxwrap.find(">.jx-unit").each(function (i, e) {
        if ($(this).data('num') == _this.nCurr) {
            $(this).addClass('on').siblings().removeClass('on');
            if (_this.defaults.sDirection == "horizontal") {
                $(this).css({ "margin-left": _this.defaults.nOnMargin - _this.defaults.nMargin, "margin-right": _this.defaults.nOnMargin });
            } else {
                $(this).css({ "margin-top": _this.defaults.nOnMargin - _this.defaults.nMargin, "margin-bottom": _this.defaults.nOnMargin });
            }

        } else {
            if (_this.defaults.sDirection == "horizontal") {
                $(this).css({ "margin-left": "", "margin-right": _this.defaults.nMargin });
            } else {
                $(this).css({ "margin-top": "", "margin-bottom": _this.defaults.nMargin });
            }
        }


    });




} //JXSLIDER.prototype.addEventMoment


//페이징 버튼 생성 및 이벤트
JXSLIDER.prototype.addEventControl = function () {
    var _this = this;

    _this.jxcontrol.find('.jx-cbtn').remove(); //empty();
    //.jxunit 갯수만큼 버튼을 생성하고
    for (var i = 0; i < _this.nTotalPaging; i++) {
        var $btn = $("<span class='jx-cbtn'><i>" + (_this.nTotalPaging - i) + "</i></span>");
        //_this.jxcontrol.append($btn);
        _this.jxcontrol.prepend($btn);
    }

    _this.jxcontrol.find(".jx-cbtn").eq(_this.nCurrPaging).addClass("on").trigger("click");

    _this.jxcontrol.find(".jx-cbtn").unbind("click");
    _this.jxcontrol.find(".jx-cbtn").click(function (e) {

        _this.select($(this).index());

        if (_this.defaults.bAuto) { _this.addEventAuto(true); }

    }).mouseenter(function (event) {
        if (_this.defaults.bAuto) { _this.addEventAuto(false); }
    }).mouseleave(function (event) {
        if (_this.defaults.bAuto) { _this.addEventAuto(true); }
        _this.bMovIng = false;
    });


} //JXSLIDER.prototype.addEventControl

JXSLIDER.prototype.select = function (v) {
    var _this = this;

    if (_this.bMovIng || _this.jxwrap.is(':animated')) {
        return;
    }
    var nChr = _this.nCurrPaging - v;

    _this.nCurrPaging = v;

    if (_this.defaults.bGroupMove) {
        _this.nCurr = v * _this.defaults.nView;
        var view = _this.defaults.nView;
    } else {
        _this.nCurr = v;
        var view = 1;
    }

    if (nChr < 0) {
        if (_this.defaults.bLoop) {
            _this.rmv(Math.abs(nChr) * view);
        } else {
            _this.rmv(v * view);
        }
    }

    if (nChr > 0) {

        if (_this.defaults.bLoop) {
            _this.lmv(Math.abs(nChr) * view);
        } else {
            _this.lmv(v * view);
        }
    }

} //JXSLIDER.prototype.select


//드래그 이벤트
JXSLIDER.prototype.addEventDrag = function () {
    //alert(1)
    var _this = this;

    var sEventOver, sEventStart, sEventMove, sEventEnd;

    sEventOver = "mouseover";

    //if  (bMobile)
    if (_this.bMobile) {
        sEventStart = "touchstart";
        sEventMove = "touchmove";
        sEventEnd = "touchend";
    } else {
        sEventStart = "mousedown";
        sEventMove = "mousemove";
        sEventEnd = "click mouseleave";
        //sEventEnd = "mouseup mouseleave";

    }

    var nSX = 0,
        nSY = 0; // 클릭시에 처음 지점
    var nCX = 0,
        nCY = 0; // 무브시에 차이값
    //var nEX = 0 ; // 끝난지점
    var nPX = undefined,
        nMX; // 드래그 할때 한쪽 방향으로만 이동하면 되지만 왔다 갔다 했을때는 문제가 되기 때문에 이 변수에 담아서 확
    var nPY = undefined,
        nMY;


    _this.jxbox.bind(sEventOver, function (e) {
        //console.log("over")
        //_this.bPcIng = false;

    }).bind(sEventStart, function (e) {
        //console.log ( "sEventStart = " , nSX)
        e.stopPropagation();
        nSX = (e.originalEvent.touches) ? e.originalEvent.touches[0].clientX : e.originalEvent.clientX;
        nSY = (e.originalEvent.touches) ? e.originalEvent.touches[0].clientY : e.originalEvent.clientY;

        //_this.bPcIng = true;
        if (_this.defaults.bAction) {

        }
        _this.bPcIng = true


        _this.nAddStep = 0;
        if (_this.defaults.bAuto) { _this.addEventAuto(false); }

    }).bind(sEventMove, function (e) {
        e.stopPropagation();

        //pc에서 드래그가 계속 되는것을 방지
        if (!_this.bPcIng) { return; }

        //움직임 중이면 움직이지 못하게
        //console.log('moving ' , _this.jxwrap.is(':animated'))

        if (_this.bMovIng || _this.jxwrap.is(':animated')) { return; }


        nPX = nMX; //드래그 하는 동안 전에 좌표값(nMX : x축으로 )을  담는다
        nPY = nMY; //드래그 하는 동안 전에 좌표값(nMY : y축으로 )을  담는다
        nMX = (e.originalEvent.touches) ? e.originalEvent.touches[0].clientX : e.originalEvent.clientX; //무브시에 값을 다시 가져오고
        nMY = (e.originalEvent.touches) ? e.originalEvent.touches[0].clientY : e.originalEvent.clientY; //무브시에 값을 다시 가져오고

        nCX = nMX - nSX; //드래그 차이값
        nCY = nMY - nSY; //드래그 차이값

        if (_this.defaults.sDirection == "horizontal") {
            if (Math.abs(nCX) > Math.abs(nCY)) {
                if (e.cancelable) {
                    e.preventDefault();
                }
            } else {
                return; //console.log("좌우 움직이지 마")
            }
        } else {
            if (Math.abs(nCX) < Math.abs(nCY)) {
                if (e.cancelable) {
                    e.preventDefault(); //console.log(" x축 값이 더 크면 스크롤 막자 ") }
                }
            } else {
                return; //console.log("좌우 움직이지 마")
            }
        }

        //console.log('<<<<<<<<<<<<<<< ' , Math.abs(nCX) , Math.abs(_this.nCuv)  )

        if (_this.defaults.bLoop) {
            //루프 일때

            if (_this.defaults.sDirection == "horizontal") {
                //가로형
                if (!_this.defaults.bGroupMove) {
                    _this.nCopy = Math.abs(Math.ceil(nCX / _this.nMove)); //몇개의 .jxunit를 이동할 타이밍 잡기 왼드래그할땐 0부터 시작이고 우드래그할땐 1부터 시작
                } else {
                    //console.log('rrrr')
                    _this.nCopy = _this.defaults.nView;
                    //_this.nCopy = Math.abs(  Math.ceil( nCX /  _this.nMove  ) ) ; //몇개의 .jxunit를 이동할 타이밍 잡기 왼드래그할땐 0부터 시작이고 우드래그할땐 1부터 시작
                }

                if (nPX > nMX) {
                    //console.log('<<<<<<<<<<<<<<< ' , Math.abs(nCX) , Math.abs(_this.nCuv)  )
                    if (_this.defaults.bGroupMove) {
                        //왼쪽으로 드래그할때만
                        //_this.nSave = 4;//_this.defaults.nView;
                    }

                    if (_this.nSave != _this.nCopy) {
                        //값이 다를경우며
                        _this.nSave = _this.nCopy;

                        if (!_this.defaults.bGroupMove) {
                            _this.nAddStep++; //몇개의 li값 붙는지 저장하고
                            var $jxunit = _this.jxwrap.find(">.jx-unit:first") // 첫번째를 뒤에 붙이고
                            _this.jxwrap.append($jxunit);
                        }

                    }
                }

                if (nPX < nMX) {
                    //왼에서 우로 드래그
                    //console.log('>>>>>>>>>>>>>>>> ' , _this.nCopy , _this.nMove , Math.abs(nCX)  )

                    if (_this.nSave != _this.nCopy) {
                        _this.nSave = _this.nCopy;
                        if (!_this.defaults.bGroupMove) {
                            _this.nAddStep--; //몇개의 .jxunit값 붙는지 저장하고
                            var $jxunit = _this.jxwrap.find(">.jx-unit:last"); //마지막을 앞에 붙이고
                            _this.jxwrap.prepend($jxunit);
                        } else {
                            if (_this.nCurr - _this.defaults.nView < 0 && _this.nTotal % _this.defaults.nView != 0) {
                                _this.nAddStep = _this.nTotal % _this.defaults.nView * -1;
                            } else {
                                _this.nAddStep = _this.defaults.nView * -1; //몇개의 li값 붙는지 저장하고
                            }

                            for (var i = 0; i < Math.abs(_this.nAddStep); i++) {
                                var $jxunit = _this.jxwrap.find(">.jx-unit:last") // 첫번째를 뒤에 붙이고
                                _this.jxwrap.prepend($jxunit);
                            }
                        }
                    }
                }

                var ntx = _this.nEX + nCX - (_this.nMove * _this.nAddStep * -1);

            } else {

                //세로형
                if (!_this.defaults.bGroupMove) {
                    _this.nCopy = Math.abs(Math.ceil(nCY / _this.nMove)); //몇개의 .jxunit를 이동할 타이밍 잡기 왼드래그할땐 0부터 시작이고 우드래그할땐 1부터 시작
                } else {
                    _this.nCopy = _this.defaults.nView;
                    //_this.nCopy = Math.abs(  Math.ceil( nCX /  _this.nMove  ) ) ; //몇개의 .jxunit를 이동할 타이밍 잡기 왼드래그할땐 0부터 시작이고 우드래그할땐 1부터 시작
                }

                if (nPY > nMY) {
                    //우에서 왼으로 드래그 할때
                    //console.log('<<<<<<<<<<<<<<<' )


                    if (_this.nSave != _this.nCopy) {
                        //값이 다를경우며
                        //console.log('c  '   , _this.nCurr)
                        _this.nSave = _this.nCopy;

                        if (!_this.defaults.bGroupMove) {
                            _this.nAddStep++; //몇개의 li값 붙는지 저장하고
                            var $jxunit = _this.jxwrap.find(">.jx-unit:first") // 첫번째를 뒤에 붙이고
                            _this.jxwrap.append($jxunit);
                        }

                    }
                }

                if (nPY < nMY) {
                    //왼에서 우로 드래그
                    //console.log('>>>>>>>>>>>>>>>> ' )
                    if (_this.nSave != _this.nCopy) {
                        _this.nSave = _this.nCopy;
                        if (!_this.defaults.bGroupMove) {
                            _this.nAddStep--; //몇개의 .jxunit값 붙는지 저장하고
                            var $jxunit = _this.jxwrap.find(">.jx-unit:last"); //마지막을 앞에 붙이고
                            _this.jxwrap.prepend($jxunit);
                        } else {

                            if (_this.nCurr - _this.defaults.nView < 0 && _this.nTotal % _this.defaults.nView != 0) {
                                _this.nAddStep = _this.nTotal % _this.defaults.nView * -1;
                            } else {
                                _this.nAddStep = _this.defaults.nView * -1; //몇개의 li값 붙는지 저장하고
                            }

                            for (var i = 0; i < Math.abs(_this.nAddStep); i++) {
                                var $jxunit = _this.jxwrap.find(">.jx-unit:last") // 첫번째를 뒤에 붙이고
                                _this.jxwrap.prepend($jxunit);
                            }


                        }
                    }
                }

                var ntx = _this.nEY + nCY - (_this.nMove * _this.nAddStep * -1);
            }

            if (_this.defaults.sDirection == "horizontal") {
                //console.log('move ' , ntx)
                _this.jxwrap.css({ "left": ntx }); //ul을 이동하고
            } else {
                _this.jxwrap.css({ "top": ntx }); //ul을 이동하고
            }

        } else {
            //loop 가 아닐때

            if (_this.defaults.sDirection == "horizontal") {
                _this.jxwrap.css({ "left": _this.nEX + nCX }); //ul을 이동하고
            } else {
                _this.jxwrap.css({ "top": _this.nEY + nCY }); //ul을 이동하고
            }

        }

    }).bind(sEventEnd, function (e) {

        e.stopPropagation();

        //console.log('touch end ----')

        if (_this.bMovIng || _this.jxwrap.is(':animated')) {
            return;
        }

        nMX = nPX = undefined; //드래그 왔다 갔다 담는 값을 초기화
        _this.bPcIng = false; //피시에서 드래그 계속 되는것을 방지

        if (_this.defaults.bAuto) { _this.addEventAuto(true); }

        if (_this.defaults.bLoop) {

            if (_this.defaults.sDirection == "horizontal") {
                //루프 좌우
                if (nCX < _this.defaults.nSans * -1) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }

                    var ntx = loopLeftUpNTX();
                    _this.jxwrap.stop().animate({ "left": ntx }, _this.defaults.nUlSpeed, _this.sEase, left_end);

                } else if (nCX > _this.defaults.nSans) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }

                    var ntx = loopRightDownDragNTX();
                    _this.jxwrap.stop().animate({ "left": ntx }, _this.defaults.nUlSpeed, _this.sEase, stop_end);
                } else {

                    if (Math.abs(nCX) < Math.abs(nCY)) {
                        return;
                    }
                    if (nCX > 0) {
                        _this.jxwrap.stop().animate({ "left": _this.nMove * _this.nAddStep }, _this.defaults.nUlSpeed, _this.sEase, right_end);
                    }
                    if (nCX < 0) {
                        //console.log("루프 아주 작게움직였다 왼쪽으로 " );
                        _this.jxwrap.stop().animate({ "left": 0 }, _this.defaults.nUlSpeed, _this.sEase, stop_end);
                    }
                }

            } else {
                //루프 상하
                if (nCY < _this.defaults.nSans * -1) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }

                    var ntx = loopLeftUpNTX();
                    _this.jxwrap.stop().animate({ "top": ntx }, _this.defaults.nUlSpeed, _this.sEase, left_end);
                } else if (nCY > _this.defaults.nSans) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }

                    var ntx = loopRightDownDragNTX();
                    //console.log(  "오른쪽으로 드래그" );
                    _this.jxwrap.stop().animate({ "top": ntx }, _this.defaults.nUlSpeed, _this.sEase, stop_end);

                } else {

                    if (Math.abs(nCY) < Math.abs(nCX)) {
                        //console.log("아래로 스크롤 내릴때는 좌우 움직이지 마")
                        return;
                    }

                    if (nCY > 0) {
                        _this.jxwrap.stop().animate({ "top": _this.nMove * _this.nAddStep }, _this.defaults.nUlSpeed, _this.sEase, right_end);
                    }

                    if (nCY < 0) {
                        //console.log("아주 작게움직였다 위쪽으로 " , nCX );
                        _this.jxwrap.stop().animate({ "top": 0 }, _this.defaults.nUlSpeed, _this.sEase, stop_end);
                    }
                }

            }

            function loopLeftUpNTX() {
                if (!_this.bMovIng) {
                    _this.bMovIng = true;
                }


                if (!_this.defaults.bGroupMove) {
                    _this.nAddStep++;
                    //console.log(  "왼쪽이나 위로 드래그 aa _this.nAddStep=   ", _this.nAddStep );
                    return ntx = (_this.nAddStep == 1) ? (_this.nMove * _this.nAddStep * -1) : (_this.nMove * (_this.nAddStep - (_this.nAddStep - 1)) * -1);
                } else {

                    //console.log(' loopLeftUpNTX ' , _this.nCurr )

                    if (_this.nCurr + _this.defaults.nView > _this.nTotal - 1) {
                        //_this.rv( _this.nTotal - _this.nCurr );
                        _this.nAddStep = (_this.nTotal - _this.nCurr);
                        //console.log(  "왼쪽이나 위로 드래그 bb _this.nAddStep=  aa ", _this.nCurr , " ,  " , _this.nTotal , _this.nAddStep );

                    } else {
                        //_this.rv( _this.defaults.nView );
                        _this.nAddStep = _this.defaults.nView;

                        //console.log(  "왼쪽이나 위로 드래그 bb _this.nAddStep=  bb ", _this.nAddStep );
                    }
                    //console.log(  "왼쪽이나 위로 드래그 bb _this.nAddStep=   ", _this.nAddStep );
                    //_this.nAddStep *= 2;
                    return ntx = _this.nMove * _this.nAddStep * -1;
                    //return ntx = (_this.nAddStep == 1)? (_this.nMove * _this.nAddStep * -1) :  (_this.nMove * (   _this.nAddStep - (_this.nAddStep-1)  ) * -1) ;
                }

            } //loopLeftDrag

            function loopRightDownDragNTX() {
                //console.log(  "오른쪽이나 아래로 드래그 loopRightDownDragNTX ");
                if (!_this.bMovIng) {
                    _this.bMovIng = true;
                }
                //var ntx = (_this.nAddStep == 1)? (_this.nMove * _this.nAddStep * -1) :  (_this.nMove * (_this.nAddStep-1) * -1) ;
                return ntx = 0;
            } //loopRightDownDragNTX

            //마우스를 때자 마자 바로 값을 초기화를 한번은 하고 움직이고 나서도 한번 더 하자
            //nCX = 0;

            function left_end() {
                //console.log('left_end = '  , _this.nCurr , _this.nCurrPaging )
                //var npa = (_this.nAddStep == 1)? 0 : 1;
                var npa;
                if (!_this.defaults.bGroupMove) {
                    npa = (Math.abs(_this.nAddStep) == 1) ? 0 : Math.abs(_this.nAddStep) - 1;
                } else {
                    npa = 0;
                }

                for (var i = 0; i < Math.abs(_this.nAddStep) - npa; i++) {
                    var $jxunit = _this.jxwrap.find(">.jx-unit:first");
                    _this.jxwrap.append($jxunit);
                }

                stop_end();
            } //left_end

            function right_end() {
                //console.log('right  end  = ' , _this.nCurr , _this.nCurrPaging)
                for (var i = 0; i < Math.abs(_this.nAddStep); i++) {
                    var $jxunit = _this.jxwrap.find(">.jx-unit:first");
                    _this.jxwrap.append($jxunit);
                }

                stop_end();

            } //right_end

            function currCal() {
                _this.nCurr = _this.jxwrap.find(">.jx-unit").eq(_this.defaults.nBackCopy).data("num");
                if (_this.defaults.bGroupMove) {
                    _this.nCurrPaging = Math.floor(_this.nCurr / _this.defaults.nView);
                } else {
                    _this.nCurrPaging = _this.nCurr;
                }
            } //paging

            function stop_end() {

                if (_this.defaults.sDirection == "horizontal") {
                    _this.jxwrap.css({ "left": 0 });
                } else {
                    _this.jxwrap.css({ "top": 0 });
                }

                currCal();
                _this.addEventMoment();
                drag_destrory(); //초기화
            } //stop_end

        } else {
            console.log('222')
            // loop가 아닐때
            var nAurr;

            //if ( _this.bControl  || _this.defaults.bGroupMove )
            if (_this.defaults.bGroupMove) {
                //컨트롤이 있을땐  _this.defaults.nView 단위로 이동하면 되고
                //nAurr = ( _this.defaults.nView == 1 )? 1 : _this.defaults.nView ; //몇칸을 더할것인지
                nAurr = _this.defaults.nView; //몇칸을 더할것인지
            } else {
                //컨트롤이 없을땐  드래그 한정도에 따라서
                //var nAurr = ( _this.defaults.nView == 1 )? 1 : Math.round( nCX / (_this.nMove/_this.nActive ) ); //몇칸을 더할것인지
                if (_this.defaults.sDirection == "horizontal") {
                    nAurr = Math.ceil(Math.abs(nCX / _this.nMove)); //몇칸을 더할것인지
                } else {
                    nAurr = Math.ceil(Math.abs(nCY / _this.nMove)); //몇칸을 더할것인지
                }

            }

            if (nCX < _this.defaults.nSans * -1 || nCY < _this.defaults.nSans * -1) {
                //console.log("왼쪽으로 드래그  " ,  _this.nCurr  , nAurr )
                //console.log(' left --- end  = ' , _this.nCurr , _this.nCurrPaging)
                notLoopLeftUpDrag();
            } else if (nCX > _this.defaults.nSans || nCY > _this.defaults.nSans) {
                //console.log(  "오른쪽으로 드래그" ,  _this.nCurr  , nAurr );
                notLoopRightDownDrag();
            } else {
                //console.log("아주작게 " ,      _this.bMovIng )
            }

            function notLoopLeftUpDrag() {
                if (!_this.bMovIng) {
                    _this.bMovIng = true;
                }

                //if ( _this.bControl || _this.defaults.bGroupMove )
                if (_this.defaults.bGroupMove) {
                    _this.nCurr += _this.defaults.nView;
                    _this.nCurrPaging = Math.floor(_this.nCurr / _this.defaults.nView);

                    if (_this.nCurrPaging > _this.nTotalPaging - 1) {
                        _this.nCurrPaging = _this.nTotalPaging - 1;
                        _this.nCurr = _this.nCurrPaging * _this.defaults.nView + _this.defaults.nStart;
                    }

                    //console.log('left a ' ,  _this.nCurrPaging)
                } else {
                    //nAurr++; //무조건 반내림을 해서:ceil 왼쪽으로 할땐 1을 더해주자
                    _this.nCurr += nAurr;

                    if (_this.nCurr > _this.nTotal - 1) {
                        _this.nCurr = _this.nTotal - 1;
                    }

                    _this.nCurrPaging = _this.nCurr;

                    //console.log('left b ' ,  _this.nCurrPaging)

                }

            } //notLoopLeftUpDrag

            function notLoopRightDownDrag() {
                if (!_this.bMovIng) {
                    _this.bMovIng = true;
                }

                //if ( _this.bControl || _this.defaults.bGroupMove )
                if (_this.defaults.bGroupMove) {
                    _this.nCurr -= _this.defaults.nView;
                    _this.nCurrPaging = Math.floor(_this.nCurr / _this.defaults.nView);

                    if (_this.nCurrPaging < 0) {
                        _this.nCurrPaging = 0;
                        //_this.nCurr = _this.nCurrPaging * _this.defaults.nView;
                        _this.nCurr = _this.nCurrPaging * _this.defaults.nView + _this.defaults.nStart;
                    }

                    //console.log('right a ' ,  _this.nCurrPaging)

                } else {
                    _this.nCurr -= nAurr;
                    //console.log("오른쪽  "  , Math.abs( _this.nCurr )  , nAurr)
                    if (_this.nCurr < 0) {
                        _this.nCurr = 0;
                    }

                    _this.nCurrPaging = _this.nCurr;

                    //console.log('right b ' ,  _this.nCurrPaging)
                }

            } //notLoopRightDownDrag

            var ntx = _this.nMove * _this.nCurr * -1;
            // var ntx = _this.nMove * (  Math.floor( _this.nCurr / _this.defaults.nView )  * _this.defaults.nView  )  * -1;

            if (_this.defaults.sDirection == "horizontal") {
                _this.jxwrap.stop().animate({ "left": ntx }, _this.defaults.nUlSpeed, _this.sEase, drag_destrory);
            } else {
                _this.jxwrap.stop().animate({ "top": ntx }, _this.defaults.nUlSpeed, _this.sEase, drag_destrory);
            }

        } // if( _this.defaults.bLoop )

        function drag_destrory() {

            //console.log('drag_destrory')
            if (_this.defaults.sDirection == "horizontal") {
                _this.nEX = _this.jxwrap.position().left; //드래그 다시 할때 필요한 엔드 값을 담는다.
            } else {
                _this.nEX = _this.jxwrap.position().top; //드래그 다시 할때 필요한 엔드 값을 담는다.
            }

            _this.bPcIng = false; //피시 드래그 방지
            _this.bIng = false;
            _this.bMovIng = false;
            _this.nSave = 0;
            _this.nCopy = 0;
            nPX = nPY = undefined;
            nMX = nMY = undefined;
            nCX = nCY = 0;
            _this.nAddStep = 0;

            //console.log(  "drag_destrory  " , _this.nEX )

            _this.callback();
        }

    })
} //JXSLIDER.prototype.addEventDrag

//동작후 콜백 함수
JXSLIDER.prototype.callback = function () {

    var _this = this;
    //console.log('callback  ' , _this.defaults.nBackCopy , _this.nCurr)

    if (_this.defaults.bLoop) {
        _this.jxwrap.find(">.jx-unit").eq(_this.defaults.nBackCopy).addClass("on").siblings().removeClass("on");

        //addEventMoment 이부분이 추가가 되다면 추후에 효과를 무엇을 주었는지에 따라 틀리게 해야할듯
        //_this.jxwrap.find(">.jx-unit").eq(_this.defaults.nBackCopy).find('.thumb').css({'opacity' : 1  });
        //_this.jxwrap.find(">.jx-unit").eq(_this.defaults.nBackCopy).siblings().find('.thumb').css({'opacity' : .1  });
        //var nH = _this.jxwrap.find(">.jx-unit").eq(_this.defaults.nBackCopy).innerHeight();
    } else {
        _this.jxwrap.find(">.jx-unit").eq(_this.nCurr).addClass("on").siblings().removeClass("on");
        //addEventMoment 이부분이 추가가 되다면 추후에 효과를 무엇을 주었는지에 따라 틀리게 해야할듯
        //_this.jxwrap.find(">.jx-unit").eq(_this.nCurr).find('.thumb').css({'opacity' : 1  })
        //_this.jxwrap.find(">.jx-unit").eq(_this.nCurr).siblings().find('.thumb').css({'opacity' : .1  })
        //var nH = _this.jxwrap.find(">.jx-unit").eq(_this.nCurr).innerHeight();
    }

    //console.log('call---------- ' , _this.nCurr , _this.nCurrPaging)

    if (_this.defaults.bAaptiveHeight) {
        //_this.jxwrap.stop().animate({ "height": nH }, _this.defaults.nUlSpeed, _this.sEase);
        _this.setAptiveHeight();
    }


    if (this.bControl)
    //if ( this.bControl && this.defaults.bGroupMove )
    {
        if (this.defaults.bGroupMove) {
            this.jxcontrol.find(".jx-cbtn").eq(this.nCurrPaging).addClass("on").siblings(".jx-cbtn").removeClass("on");
        } else {
            this.jxcontrol.find(".jx-cbtn").eq(this.nCurr).addClass("on").siblings(".jx-cbtn").removeClass("on");
        }
    }


    //console.log('call   ' ,  _this.defaults.reCallFnc , typeof _this.defaults.reCallFnc ,  _this.defaults.reCallFnc !="" , typeof window[ _this.defaults.reCallFnc ] === 'function')

    if (typeof _this.defaults.reCallFnc === 'string') {
        var str = _this.defaults.reCallFnc.split(' ').join('');
        if (str.length > 0 && typeof window[str] === 'function') {
            //console.log('일단 빈문자가 아닌 함수명도 있고 함수도 정의된 경우만 ')

            if (this.bControl || _this.defaults.bGroupMove) {
                eval(_this.defaults.reCallFnc)(this.nCurrPaging);
            } else {
                eval(_this.defaults.reCallFnc)(this.nCurr);
            }

        } else {
            //console.log('일단 글자가 없는경우')
        }
    } else {
        //console.log('옵션을 넘기지 않았다')
    }


} //JXSLIDER.prototype.callback


//리사이즈 시 동작
JXSLIDER.prototype.resize = function () {
    var _this = this;
    _this.defaults.bResize = true;

    this.reSet();

    if (_this.defaults.sDirection == "horizontal") {
        this.nMove = Math.ceil(this.jxbox.innerWidth() / this.defaults.nView); // 한번씩 이동할 거리를 저장해둠

        //this.jxwrap.find(">.jx-unit").css({"width": Math.ceil( this.jxbox.innerWidth() / this.defaults.nView )-_this.defaults.nMargin , "margin-right": _this.defaults.nMargin }); // .jx-unit의 가로사이즈와 간격 ( 추후에 가로냐 세로냐를 추가해야함)
        //this.jxwrap.css({"width" : this.nMove * this.nTotal }) // ul의 가로 사이즈를 .jx-unit의 갯수만큼

        this.jxwrap.find(">.jx-unit").each(function (i, e) {
            if ($(this).hasClass('on')) {
                $(this).css({
                    "width": Math.ceil(_this.jxbox.innerWidth() / _this.defaults.nView) - _this.defaults.nMargin,
                    "margin-left": _this.defaults.nOnMargin - _this.defaults.nMargin,
                    "margin-right": _this.defaults.nOnMargin
                });
            } else {
                $(this).css({ "width": Math.ceil(_this.jxbox.innerWidth() / _this.defaults.nView) - _this.defaults.nMargin, "margin-right": _this.defaults.nMargin });
            }
        });

        this.jxwrap.css({ "width": (this.nMove * this.nTotal) + this.defaults.nOnMargin * 2 })

    } else {
        this.nMove = Math.ceil(this.jxbox.innerHeight() / this.defaults.nView); // 한번씩 이동할 거리를 저장해둠
        //this.jxwrap.find(">.jx-unit").css({"height": Math.ceil( this.jxbox.innerHeight() / this.defaults.nView )-_this.defaults.nMargin , "margin-bottom": _this.defaults.nMargin , "float" : "none" }); // .jx-unit의 가로사이즈와 간격 ( 추후에 가로냐 세로냐를 추가해야함)
        //this.jxwrap.css({"height" : this.nMove * this.nTotal }) // ul의 가로 사이즈를 .jxunit의 갯수만큼

        this.jxwrap.find(">.jx-unit").each(function (i, e) {
            if ($(this).hasClass('on')) {
                $(this).css({
                    "height": Math.ceil(_this.jxbox.innerHeight() / _this.defaults.nView) - _this.defaults.nMargin,
                    "float": "none",
                    "margin-top": _this.defaults.nOnMargin - _this.defaults.nMargin,
                    "margin-bottom": _this.defaults.nOnMargin
                });
            } else {
                $(this).css({
                    "height": Math.ceil(_this.jxbox.innerHeight() / _this.defaults.nView) - _this.defaults.nMargin,
                    "float": "none",
                    "margin-bottom": _this.defaults.nMargin
                });
            }

        });

        this.jxwrap.css({ "height": (this.nMove * (this.nTotal)) + this.defaults.nOnMargin * 2 });

    }


    if (!_this.defaults.bLoop) {
        //루프가 아닐때는 리사이징 될때 박스의 위치가 틀어지므로 재위치를 잡아야한다.
        _this.nEX = _this.nCurr * this.nMove * -1;
        this.jxwrap.css({ "left": _this.nEX });
    }

    if (_this.defaults.bAuto) {
        _this.addEventAuto(true);
    }

    _this.nBase = _this.nMove * _this.defaults.nBackCopy;
    _this.nCenter = _this.jxwrap.offset().left + _this.nBase; //이게 기준이 되는 부분



    //console.log('_this.nBase resize ' , _this.nCenter )

} //JXSLIDER.prototype.resize