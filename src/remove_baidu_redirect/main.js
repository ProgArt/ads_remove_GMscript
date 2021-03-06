import $ from '../../libs/jqLite';
import Q from 'q';
import CONFIG from './config';
import $http from '../../libs/$http';

class main {
  constructor(agm = '') {
    if (!agm) return this;

    this.inViewPort = [];

    $(agm).each(ele => $.fn.visible(ele) && this.inViewPort.push(ele))
  }

  /**
   * request a url which has origin links
   * @returns {Promise}
   */
  all() {
    var deferred = Q.defer();

    let url = window.top.location.href.replace(/(\&)(tn=\w+)(\&)/img, '$1' + 'tn=baidulocal' + '$3');

    CONFIG.isDecodingAll = true;

    $http.get(url, {timeout: 2000})
      .then(function (response) {
        CONFIG.isDecodingAll = false;

        if (!response) return;
        let responseText = response.responseText;

        // remove the image/script/css resource
        responseText = responseText.replace(/(src=[^>]*|link=[^>])/g, '');

        let html = document.createElement('html');
        html.innerHTML = responseText;

        $('.t>a:not(.OP_LOG_LINK):not([decoded])').each(sourceEle=> {
          $('.f>a', html).each((targetEle) => {
            if ($(sourceEle).text().trim() === $(targetEle).text().trim()) {
              sourceEle.href = targetEle.href;
              $(sourceEle).attr('decoded', true);
            }
          });
        });

        deferred.resolve(response);

      }, function (response) {
        CONFIG.isDecodingAll = false;
        deferred.reject(response);
      });

    return deferred.promise;
  }

  one(aEle) {
    var deferred = Q.defer();

    $(aEle).attr('decoding', true);

    $http.head(aEle.href, {timeout: 2000, anonymous: true})
      .then(function (response) {
        $(aEle)
          .attr('href', response.finalUrl)
          .attr('decoded', true)
          .removeAttr('decoding');
        deferred.resolve(response);
      }, function (response) {
        $(aEle).removeAttr('decoding');
        deferred.reject(response);
      });

    return deferred.promise;
  }

  /**
   * request the A tag's href one by one those in view port
   * @returns {main}
   */
  oneByOne() {
    $(this.inViewPort).each(aEle => {
      if (!main.match(aEle)) return;
      this.one(aEle);
    });
    return this;
  }

  /**
   * match the Element
   */
  static match(ele) {
    if (ele.tagName !== "A"
      || !ele.href
      || !/www\.baidu\.com\/link\?url=/im.test(ele.href)
      || !!$(ele).attr('decoded')
      || !!$(ele).attr('decoding')
    ) {
      return false;
    } else {
      return true;
    }
  }

}

export default main;