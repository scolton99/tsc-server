const decm = new Array('G',0,'H',1,'I',2,'J',3,'K',4,'L',5,'M',6,'N',7,'O',8,'P',9,'Q',10,'R',11,'S',12,'T',13,'U',14,'V',15,'W',16,'X',17,'Y',18,'Z',19,'a',20,'b',21,'c',22,'d',23,'e',24,'f',25,'g',26,'h',27,'i',28,'j',29,'k',30,'l',31,'m',32,'n',33,'o',34,'p',35,'q',36,'r',37,'s',38,'t',39,'u',40,'v',41,'w',42,'x',43,'y',44,'z',45);
const unfixPattern = /__[aqtmduscpP3456780fFQeEgGBWwCAIMU]/;

const cm = new Array();
let j = 0;
for (let i = 71; i <= 90; i++)
  cm[j++] = String.fromCharCode(i);

for (let i = 97; i <= 122; i++)
  cm[j++] = String.fromCharCode(i);

// Taken from FP JS
const compress = n => {
  const a = Math.floor(n / (cm.length * cm.length)); 
  const b = Math.floor((n - (a * cm.length * cm.length))/ cm.length);
  const c = n - (a * cm.length * cm.length + b * cm.length);

  return cm[a].toString() + cm[b].toString() + cm[c].toString();
}

const getDecmValue = thisCharacter => {
  for (let i = 0; i < decm.length; i += 2)
     if (decm[i] == thisCharacter)
        return decm[i + 1];
};

const unfix_ucs2 = input => {
	let newValue = "";
  const chars = input.split("");
  
	for (let i = 0; i < chars.length; i += 3) {
    const number = 2116 * getDecmValue(chars[i]) + 46 * getDecmValue(chars[i+1]) + getDecmValue(chars[i+2]);
    newValue += String.fromCharCode(number);
	}

	return newValue;
}

const unfix_utf8 = input => {
	let newValue = "";
	const chars = input.split("");
  let i = 0;
  
	let number = "";
  let lastIndex = 0;

	for (var j = 0; j < chars.length; j++) {
    lastIndex = j;
    const thisChar = chars[j];

    if (thisChar == 'A' || thisChar == 'B' || thisChar == 'C' || thisChar == 'D' || thisChar == 'E' || thisChar == 'F' || (thisChar <= 9 && thisChar >= 0)) {
		  number += thisChar;
    } else if (thisChar == "_") {
		  i = j;
		  break;
    } else {
		  break;
    }
  }
  
	if (number != "") {
    if ((number.length % 2) == 1){
      newValue = "__U" + input + "_";
    } else {
      let uchar = "";
      const numbers = number.split("");
      const allValues = new Array();
      
      let temp = 0;
      for (let i = 0; i < numbers.length; i += 2) {
        temp++;

        if (temp > 4)
          break;
        
        let hex = "" + numbers[i];
        if (numbers[i + 1] != null)
            hex += "" + numbers[i+1];

        const hexString = "0x" + hex;
        const value = Number(hexString);
        uchar += String.fromCharCode(value);
        
        allValues[allValues.length] = value;
      }

      newValue += uchar;
    }
	} else {
    for (let thisChar = i; thisChar <= lastIndex; thisChar++) {
      newValue += chars[i];
      i = lastIndex;
    }
	}
  
  return newValue;
}

const fixField = field => {
	field =	field.replace(/ /g, "__b");
	field =	field.replace(/\'/g, "__a");
	field =	field.replace(/\"/g, "__q");
	field =	field.replace(/\`/g, "__t");
	field =	field.replace(/\@/g, "__m");
	field =	field.replace(/\./g, "__d");
	field =	field.replace(/\-/g, "__u");
	field =	field.replace(/\;/g, "__s");
	field =	field.replace(/\:/g, "__c");
	field =	field.replace(/\)/g, "__p");
	field =	field.replace(/\(/g, "__P");
	field =	field.replace(/\#/g, "__3");
	field =	field.replace(/\$/g, "__4");
	field =	field.replace(/\%/g, "__5");
	field =	field.replace(/\^/g, "__6");
	field =	field.replace(/\&/g, "__7");
	field =	field.replace(/\*/g, "__8");
	field =	field.replace(/\~/g, "__0");
	field =	field.replace(/\//g, "__f");
	field =	field.replace(/\\/g, "__F");
	field =	field.replace(/\?/g, "__Q");
	field =	field.replace(/\]/g, "__e");
	field =	field.replace(/\[/g, "__E");
	field =	field.replace(/\>/g, "__g");	
	field =	field.replace(/\</g, "__G");
	field =	field.replace(/\!/g, "__B");
	field =	field.replace(/\{/g, "__W");
	field =	field.replace(/\}/g, "__w");
	field =	field.replace(/\=/g, "__C");
	field =	field.replace(/\+/g, "__A");
	field =	field.replace(/\|/g, "__I");
	field =	field.replace(/\,/g, "__M");

	let SI = 0;
	let uchar = "";
	let newValue = "";

	for (let i = 0; i < field.length; i++) {
    u = field.charCodeAt(i);
    temp += "  " + u;

    if (u == 95 ||                // underscore
        (u >= 65 && u <= 90) ||  // A-Z  (uppercase)
        (u >= 97 && u <= 122) || // a-z  (lowercase)
        (u >= 48 && u <= 57)) {    // 0-9
      if(SI != 0) {
		    newValue += "__U" + uchar + "_";
		    SI = 0;
		    uchar = "";
      }
      
		  newValue += String.fromCharCode(u);
    } else if (u < 128) {
		  if(SI != 0) {
        newValue += "__U" + uchar + "_";
        SI = 0;
        uchar = "";
      }
      
      newValue += "__U" + String.fromCharCode(u) + "_";
    } else {
      uchar += compress(u);
      SI++;
    } 
	}

	if (SI != 0)
    newValue += "__U" + uchar + "_";

  if (newValue != "")
    return newValue;
	else
	  return field;
}

const unfixField = field => {
  field =	field.replace(/__b/g, " ");
  
  if (!unfixPattern.test(field))
    return field;

	field =	field.replace(/__a/g, "'");
	field =	field.replace(/__q/g, "\"");
	field =	field.replace(/__t/g, "`");
	field =	field.replace(/__m/g, "@");
	field =	field.replace(/__d/g, ".");
	field =	field.replace(/__u/g, "-");

	field =	field.replace(/__s/g, ";");
	field =	field.replace(/__c/g, ":");
	field =	field.replace(/__p/g, ")");
	field =	field.replace(/__P/g, "(");
	field =	field.replace(/__3/g, "#");
	field =	field.replace(/__4/g, "$");
	field =	field.replace(/__5/g, "%");
	field =	field.replace(/__6/g, "^");
	field =	field.replace(/__7/g, "&");
	field =	field.replace(/__8/g, "*");

	field =	field.replace(/__0/g, "~");
	field =	field.replace(/__f/g, "/");
	field =	field.replace(/__F/g, "\\");
	field =	field.replace(/__Q/g, "?");
	field =	field.replace(/__e/g, "]");
	field =	field.replace(/__E/g, "[");

	field =	field.replace(/__g/g, ">");
	field =	field.replace(/__G/g, "<");
	field =	field.replace(/__B/g, "!");
	field =	field.replace(/__W/g, "{");
	field =	field.replace(/__w/g, "}");
	field =	field.replace(/__C/g, "=");
	field =	field.replace(/__A/g, "+");
	field =	field.replace(/__I/g, "|");
	field =	field.replace(/__M/g, ",");

  const utf8 = field.match(/__U([\dA-F]+)_/g);
  const ucs2 = field.match(/__U([G-Za-z]+)_/g);
  
  if (ucs2 != null) {
    for (var i=0;i<ucs2.length;i++) {
      const regexString = ucs2[i];
      const regex = new RegExp(regexString, "g");
      const regexSingle = new RegExp(regexString);
      
      const matches = field.match(regex);
      if (matches != null) {
        for (let j = 0; j < matches.length; j++) {
          const noUnderscores = matches[j].slice(3, (matches[j].length - 1));
          const replacement = unfix_ucs2(noUnderscores);
          
          field = field.replace(regexSingle, replacement);
        }
      }
    }
  }
  
  if (utf8 != null) {
    for (var i=0;i<utf8.length;i++) {
      const regexString = utf8[i];
      const regex = new RegExp(regexString, "g");
      const regexSingle = new RegExp(regexString);
      
      const matches = field.match(regex);
      for (let j = 0; j < matches.length; j++) {
        const noUnderscores = matches[j].slice(3, (matches[j].length - 1));
        const replacement = unfix_utf8(noUnderscores);

        field = field.replace(regexSingle, replacement);
      }
    }
  }

	return field;
}

module.exports.fix = fixField;
module.exports.unfix = unfixField;