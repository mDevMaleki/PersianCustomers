using System;

namespace PersianCustomers.Infra.Voip.Models
{
    public class IssabelConfiguration
    {
        public string Server { get; set; } = "193.151.152.32";
        public int Port { get; set; } = 5038;
        public string Username { get; set; } = "admin";
        public string Password { get; set; } = "amp111";
        public string RecordingsPath { get; set; } = "/var/spool/asterisk/monitor/";
    }

   
}
