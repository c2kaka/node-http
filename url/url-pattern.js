// import UrlPattern from "url-pattern";

// const pattern = new UrlPattern(
//     /^\/api\/([^\/]+)(?:\/(\d+))?$/,
//     ['resource', 'id']
// );
//
// console.log(pattern.match('/api/users/5'));

const url = 'http://localhost/$%7Babcd%7D/${page}/${row}?a=b'
const leftPlaceholder = encodeURI('${');
const rightPlaceholder = encodeURI('}');

const parsedUrl = new URL(url);
const pathName = parsedUrl.pathname;
const paths = pathName.split('/');

const params = paths.filter(_p => _p.startsWith(leftPlaceholder) && _p.endsWith(rightPlaceholder)).map(_p => _p.slice(leftPlaceholder.length, _p.length - rightPlaceholder.length));


console.log(pathName);
