const isLocal = ip => {
    const classA = ip.startsWith("10.");
    const classC = ip.startsWith("192.168.");
    
    let classB = ip.startsWith("172.16.");
    classB = classB || ip.startsWith("172.17.");
    classB = classB || ip.startsWith("172.18.");
    classB = classB || ip.startsWith("172.19.");
    classB = classB || ip.startsWith("172.20.");
    classB = classB || ip.startsWith("172.21.");
    classB = classB || ip.startsWith("172.22.");
    classB = classB || ip.startsWith("172.23.");
    classB = classB || ip.startsWith("172.24.");
    classB = classB || ip.startsWith("172.25.");
    classB = classB || ip.startsWith("172.26.");
    classB = classB || ip.startsWith("172.27.");
    classB = classB || ip.startsWith("172.28.");
    classB = classB || ip.startsWith("172.29.");
    classB = classB || ip.startsWith("172.30.");
    classB = classB || ip.startsWith("172.31.");

    const autoconfig = ip.startsWith("169.254.");
    const localIPv4v6 = ip.startsWith("::ffff:");
    const localIPv6 = ip.startsWith("fc00::") || ip.startsWith("::1") || ip.startsWith("fe80::");

    return classA || classB || classC || autoconfig || localIPv4v6 || localIPv6;
};

const isNU = ip => {
    return ip.startsWith("129.105.") || ip.startsWith("165.124.")
};

module.exports.isLocal = isLocal;
module.exports.isNU = isNU;